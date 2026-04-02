import { useEffect } from "react";

const BlockingClassCleanup = () => {
  useEffect(() => {
    document.documentElement.style.pointerEvents = "auto";
    document.body.style.pointerEvents = "auto";
    document.querySelectorAll("[inert]").forEach(el => el.removeAttribute("inert"));
  }, []);
  return null;
};

export default BlockingClassCleanup;
