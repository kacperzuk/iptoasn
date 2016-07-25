#ifndef BGPSEARCH_H
#define BGPSEARCH_H

#include <node.h>
#include <node_object_wrap.h>

#include <string>
#include <vector>

class BGPSearch : public node::ObjectWrap {
  public:
    static void Init(v8::Local<v8::Object> exports);

    bool push(std::string row);
    void push(uint32_t start, uint32_t end, uint8_t netmask, uint32_t asn);
    bool find(std::string ip, uint32_t &asn);
    bool find(uint32_t ip, uint32_t &asn);

#ifndef BGPSEARCHTEST
  private:
#endif
    // v8
    static void New(const v8::FunctionCallbackInfo<v8::Value>& args);
    static void push(const v8::FunctionCallbackInfo<v8::Value>& args);
    static void find(const v8::FunctionCallbackInfo<v8::Value>& args);
    static v8::Persistent<v8::Function> constructor;

    // ip_start, ip_end, asn, ip_start, ip_end, asn...
    std::vector< std::vector<uint32_t> > bgp_ranges_;

    explicit BGPSearch();
    ~BGPSearch();
    bool parseIPv4(std::string token, uint32_t &network);
    bool parseNetmaskBits(std::string token, uint8_t &netmask_bits);
    bool parseASN(std::string token, uint32_t &asn);
    void networkToRange(uint32_t network, uint8_t netmask_bits, uint32_t &start, uint32_t &end);
    bool find(uint32_t ip, uint8_t netmask, uint32_t &asn);
};

#endif
