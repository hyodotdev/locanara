#include <jni.h>

#ifdef ANDROID
#undef ANDROID
#endif
#ifdef IOS
#undef IOS
#endif

#include "NitroOndeviceAiOnLoad.hpp"

JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM* vm, void*) {
  return margelo::nitro::ondeviceai::initialize(vm);
}
