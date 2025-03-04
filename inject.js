// 这个文件将被注入到页面上下文中
window.addEventListener("VUE_HELPER_MESSAGE", function (event) {
  try {
    const element = document.querySelector(event.detail.selector);

    const instance = element.__vueParentComponent || element.__vue__;

    if (instance) {
      instance.$emit("input", event.detail.newValue);


      window.dispatchEvent(
        new CustomEvent("VUE_HELPER_RESPONSE", {
          detail: { message: "success", uid: event.detail.uid },
        })
      );
    } else {
      throw "找不到 Vue 实例";
    }
  } catch (error) {
    window.dispatchEvent(
      new CustomEvent("VUE_HELPER_ERROR", {
        detail: { error, uid: event.detail.uid },
      })
    );
  }
});
