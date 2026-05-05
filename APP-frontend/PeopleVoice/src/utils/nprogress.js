import NProgress from "nprogress";
import "nprogress/nprogress.css";

NProgress.configure({
  showSpinner: false,
  trickle: true,
  trickleSpeed: 300, // 🔥 increase panna slow aagum
  minimum: 0.1, // starting width
});

export default NProgress;