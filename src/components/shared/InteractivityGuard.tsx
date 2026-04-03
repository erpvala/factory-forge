// @ts-nocheck
import { useEffect } from "react";

const InteractivityGuard = () => {
  useEffect(() => {
    const check = () => {
      document.documentElement.style.pointerEvents = "auto";
      document.body.style.pointerEvents = "auto";
    };
    check();
    const id = setInterval(check, 3000);
    return () => clearInterval(id);
  }, []);
  return null;
};

export default InteractivityGuard;
