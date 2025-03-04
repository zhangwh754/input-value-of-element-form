window.addEventListener("load", function () {
  document.querySelector("#app").addEventListener("focusin", async (event) => {
    const target = event.target;

    if (target.tagName === "INPUT") {
      await new Promise((resolve) => setTimeout(resolve, 100));
      getParentLabel(target, target);
    }
  });
});

// 注入脚本到页面上下文
const script = document.createElement("script");
script.src = chrome.runtime.getURL("inject.js");
document.documentElement.appendChild(script);
script.remove();

async function updateSelectValueByVueInstance(element, newValue) {
  return new Promise((resolve, reject) => {
    const uid = Date.now().toString();
    const selector = getUniqueSelector(element);

    const handleResponse = (event) => {
      if (event.detail.uid === uid) {
        window.removeEventListener("VUE_HELPER_RESPONSE", handleResponse);
        window.removeEventListener("VUE_HELPER_ERROR", handleError);
        resolve(event.detail.instance);
      }
    };

    const handleError = (event) => {
      if (event.detail.uid === uid) {
        window.removeEventListener("VUE_HELPER_RESPONSE", handleResponse);
        window.removeEventListener("VUE_HELPER_ERROR", handleError);
        reject(event.detail.error);
      }
    };

    window.addEventListener("VUE_HELPER_RESPONSE", handleResponse);
    window.addEventListener("VUE_HELPER_ERROR", handleError);

    // 发送请求到页面上下文
    window.dispatchEvent(
      new CustomEvent("VUE_HELPER_MESSAGE", {
        detail: { selector, uid, newValue },
      })
    );
  });
}

// 帮助函数：生成唯一选择器
function getUniqueSelector(element) {
  const path = [];
  while (element && element.nodeType === Node.ELEMENT_NODE) {
    let selector = element.nodeName.toLowerCase();
    if (element.id) {
      selector += `#${element.id}`;
      path.unshift(selector);
      break;
    } else {
      let sibling = element;
      let nth = 1;
      while (sibling.previousElementSibling) {
        sibling = sibling.previousElementSibling;
        nth++;
      }
      selector += `:nth-child(${nth})`;
    }
    path.unshift(selector);
    element = element.parentNode;
  }
  return path.join(" > ");
}

async function updateValue(element, origin, label) {
  const elSelect = element.querySelector(".el-select");

  if (elSelect) {
    try {
      // 从页面上下文获取Vue实例
      const newValue = Math.floor(Math.random() * 1000).toString();

      await updateSelectValueByVueInstance(elSelect, newValue);

      alertMsg(label, newValue);
    } catch (error) {
      console.error("获取Vue实例失败:", error);
    }
  } else {
    const inputEvent = new Event("input");
    const newValue = Math.floor(Math.random() * 1000).toString();

    origin.value = newValue;
    origin.dispatchEvent(inputEvent);

    alertMsg(label, newValue);
  }
}

function alertMsg(label, value) {
  console.log(`${label}更新的值为${value}`);
}

function getParentLabel(element, origin) {
  while (element) {
    const labels = element.querySelectorAll(".el-form-item__label");

    if (labels.length == 0) {
      return getParentLabel(element.parentNode, origin);
    }
    if (labels.length == 1) {
      const label = labels[0];

      updateValue(element, origin, label.innerText);

      return;
    }
    if (labels.length > 1) {
      console.log("找不到对应的结构");
      return;
    }
  }
}
