#include "bgpsearch.h"

#include <sstream>
#include <limits>
#include <errno.h>

using v8::Context;
using v8::Function;
using v8::FunctionCallbackInfo;
using v8::FunctionTemplate;
using v8::Isolate;
using v8::Local;
using v8::Number;
using v8::Object;
using v8::Persistent;
using v8::String;
using v8::Value;
using v8::Boolean;
using v8::Null;

Persistent<Function> BGPSearch::constructor;


BGPSearch::BGPSearch() {
  bgp_ranges_.resize(33);
}

BGPSearch::~BGPSearch() {
}

void BGPSearch::Init(Local<Object> exports) {
  Isolate* isolate = exports->GetIsolate();

  // Prepare constructor template
  Local<FunctionTemplate> tpl = FunctionTemplate::New(isolate, New);
  tpl->SetClassName(String::NewFromUtf8(isolate, "BGPSearch"));
  tpl->InstanceTemplate()->SetInternalFieldCount(1);

  // Prototype
  NODE_SET_PROTOTYPE_METHOD(tpl, "push", push);
  NODE_SET_PROTOTYPE_METHOD(tpl, "find", find);

  constructor.Reset(isolate, tpl->GetFunction());
  exports->Set(String::NewFromUtf8(isolate, "BGPSearch"),
      tpl->GetFunction());
}

void BGPSearch::New(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();

  if (args.IsConstructCall()) {
    // Invoked as constructor: `new BGPSearch(...)`
    BGPSearch* obj = new BGPSearch();
    obj->Wrap(args.This());
    args.GetReturnValue().Set(args.This());
  } else {
    // Invoked as plain function `BGPSearch(...)`, turn into construct call.
    const int argc = 1;
    Local<Value> argv[argc] = { args[0] };
    Local<Context> context = isolate->GetCurrentContext();
    Local<Function> cons = Local<Function>::New(isolate, constructor);
    Local<Object> result =
      cons->NewInstance(context, argc, argv).ToLocalChecked();
    args.GetReturnValue().Set(result);
  }
}

void BGPSearch::find(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();

  BGPSearch* obj = ObjectWrap::Unwrap<BGPSearch>(args.Holder());

  if(args[0]->IsUndefined()) {
    exit(5);
  }

  v8::String::Utf8Value param1(args[0]->ToString());
  std::string ip = std::string(*param1);

  uint32_t asn;
  if(obj->find(ip, asn)) {
    args.GetReturnValue().Set(Number::New(isolate, asn));
  } else {
    args.GetReturnValue().Set(Null(isolate));
  }
}

void BGPSearch::push(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();

  BGPSearch* obj = ObjectWrap::Unwrap<BGPSearch>(args.Holder());

  if(args[0]->IsUndefined()) {
    exit(5);
  }

  String::Utf8Value param1(args[0]->ToString());
  std::string row = std::string(*param1);

  bool success = obj->push(row);

  args.GetReturnValue().Set(Boolean::New(isolate, success));
}


bool BGPSearch::parseIPv4(std::string token, uint32_t &network) {
  uint8_t offset = 32;
  network = 0;

  std::istringstream stream(token);
  std::string octet_str;

  unsigned long octet;
  char *end = NULL;
  while(std::getline(stream, octet_str, '.') && offset > 0) {
    errno = 0;
    octet = strtoul(octet_str.c_str(), &end, 10);
    if(end == octet_str || errno != 0 || octet > 255) return false;

    offset -= 8;
    network += octet << offset;
  }

  if(offset != 0) return false;
  if(std::getline(stream, octet_str, '.')) return false;

  return true;
}

bool BGPSearch::parseNetmaskBits(std::string token, uint8_t &netmask_bits) {
  char *end;
  errno = 0;
  unsigned long netmask_bits_ul = strtoul(token.c_str(), &end, 10);

  if(end == token || errno != 0 || netmask_bits_ul > 32) return false;

  netmask_bits = netmask_bits_ul;

  return true;
}

bool BGPSearch::parseASN(std::string token, uint32_t &asn) {
  char *end;
  errno = 0;
  unsigned long asn_ul = strtoul(token.c_str(), &end, 10);

  if(end == token || errno != 0 || asn_ul > std::numeric_limits<uint32_t>::max()) return false;

  asn = asn_ul;

  return true;
}

void BGPSearch::networkToRange(uint32_t network, uint8_t netmask_bits, uint32_t &start, uint32_t &end) {
  uint32_t netmask = (0xFFFFFFFFL << (32-netmask_bits)) & 0xFFFFFFFFL;
  start = network & netmask;
  end = network | ~netmask;
}

bool BGPSearch::push(std::string row) {
  uint32_t start, end, asn;

  uint32_t network;
  uint8_t netmask;

  std::istringstream stream(row);
  std::string token;

  // get network address
  if(!std::getline(stream, token, '/')) {
    return false;
  }

  if(!parseIPv4(token, network)) {
    return false;
  }

  // get netmask
  if(!std::getline(stream, token, ' ')) {
    return false;
  }

  if(!parseNetmaskBits(token, netmask)) {
    return false;
  }

  // get ASN
  if(!std::getline(stream, token, ' ')) {
    return false;
  }

  if(!parseASN(token, asn)) {
    return false;
  }

  networkToRange(network, netmask, start, end);
  push(start, end, netmask, asn);

  return true;
}

void BGPSearch::push(uint32_t start, uint32_t end, uint8_t netmask, uint32_t asn) {
  assert(netmask <= 32);
  if(bgp_ranges_[netmask].size() >= 3) {
    std::vector<uint32_t>::reverse_iterator rit = bgp_ranges_[netmask].rbegin();
    uint32_t prev_start = *(rit+2);
    uint32_t prev_end = *(rit+1);
    if(start == prev_start && end == prev_end) {
      return;
    }

    assert(start > prev_end);
  }
  bgp_ranges_[netmask].push_back(start);
  bgp_ranges_[netmask].push_back(end);
  bgp_ranges_[netmask].push_back(asn);
}

bool BGPSearch::find(std::string ip, uint32_t &asn) {
  uint32_t ip_u;
  if(!parseIPv4(ip, ip_u))
    return false;

  return find(ip_u, asn);
}

bool BGPSearch::find(uint32_t ip, uint32_t &asn) {
  // crappy attempt at longest-prefix first matching
  for(uint8_t i = 33; i > 0; i--) {
    if(find(ip, i-1, asn)) {
      return true;
    }
  }
  return false;
}

bool BGPSearch::find(uint32_t ip, uint8_t netmask, uint32_t &asn) {
  if(bgp_ranges_[netmask].size() <= 0) return false;

  size_t fromIndex = 0;
  size_t toIndex = bgp_ranges_[netmask].size()/3 - 1;

  size_t middleIndex = 0;
  uint32_t start, end;

  while(fromIndex <= toIndex) {
    middleIndex = fromIndex + ((toIndex - fromIndex) / 2);

    start = bgp_ranges_[netmask][middleIndex*3];
    end = bgp_ranges_[netmask][middleIndex*3 + 1];

    if(ip > start && ip > end) {
      fromIndex = middleIndex + 1;
    } else if(ip < start && ip < end) {
      if(middleIndex == 0) break;
      toIndex = middleIndex - 1;
    } else if(ip >= start && ip <= end) {
      asn = bgp_ranges_[netmask][middleIndex*3 + 2];
      return true;
    }
  }

  return false;
}
