import type { ComponentPropsWithoutRef, MouseEvent } from "react";
import { navigate } from "./router";

/**
 * Drop-in replacement for <a> that uses the History API for internal
 * routes (href starting with "/") and falls back to native behavior
 * for anchors, external links, and modified clicks (cmd/ctrl/etc).
 */
export default function Link({ href, onClick, ...rest }: ComponentPropsWithoutRef<"a">) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (onClick) onClick(event);
    if (event.defaultPrevented) return;
    if (event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (!href || !href.startsWith("/")) return;

    event.preventDefault();
    navigate(href);
  }

  return <a href={href} onClick={handleClick} {...rest} />;
}
