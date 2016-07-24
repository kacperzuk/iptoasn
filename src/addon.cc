// addon.cc
#include <node.h>
#include "bgpsearch.h"

using v8::Local;
using v8::Object;

void InitAll(Local<Object> exports) {
  BGPSearch::Init(exports);
}

NODE_MODULE(addon, InitAll)
