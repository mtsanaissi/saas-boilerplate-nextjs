import { getRequestConfig } from "next-intl/server";
import messages from "@/messages/en";

export default getRequestConfig(async () => {
  const locale = "en";

  return {
    locale,
    messages,
  };
});
