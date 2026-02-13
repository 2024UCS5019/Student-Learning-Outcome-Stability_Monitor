module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0f172a",
        haze: "#e2e8f0",
        prism: "#0ea5e9",
        moss: "#22c55e",
        ember: "#f97316",
        noir: "#020617"
      },
      fontFamily: {
        display: ["Space Grotesk", "system-ui", "sans-serif"],
        body: ["IBM Plex Sans", "system-ui", "sans-serif"]
      },
      boxShadow: {
        panel: "0 12px 30px rgba(2, 6, 23, 0.12)"
      }
    }
  },
  plugins: []
};
