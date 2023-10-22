import { type Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";
import { withUt } from "uploadthing/tw";

export default withUt({
  content: ["./src/**/*.tsx"],
  theme: {
    extend: {
      fontFamily: {},
      colors: {
        textcolor: "#37352f",
      },
    },
  },
  plugins: [],
}) satisfies Config;
