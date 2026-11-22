import "server-only";
import sanitizeHtml from "sanitize-html";

/** Cleans rich text coming from the editor before it is stored. */
export function sanitizeRichText(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      "p", "h2", "h3", "h4", "strong", "b", "em", "i", "u", "s", "a", "ul", "ol", "li", "blockquote", "code", "pre",
      "br", "hr", "img", "table", "thead", "tbody", "tr", "th", "td", "colgroup", "col", "iframe", "div",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt", "title", "width", "height"],
      iframe: ["src", "width", "height", "allowfullscreen", "frameborder", "allow"],
      th: ["colspan", "rowspan", "colwidth"],
      td: ["colspan", "rowspan", "colwidth"],
      col: ["style"],
      div: ["data-youtube-video"],
    },
    allowedSchemes: ["https", "http", "mailto", "tel"],
    allowedSchemesByTag: { img: ["https"] },
    allowProtocolRelative: false,
    allowedIframeHostnames: ["www.youtube.com", "youtube.com", "www.youtube-nocookie.com", "player.vimeo.com"],
    transformTags: {
      a: (tagName, attribs) => ({
        tagName,
        attribs: { ...attribs, ...(attribs.href?.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {}) },
      }),
    },
    exclusiveFilter: (frame) => frame.tag === "img" && !(frame.attribs.src?.startsWith("/media/") || frame.attribs.src?.startsWith("https://")),
  });
}
