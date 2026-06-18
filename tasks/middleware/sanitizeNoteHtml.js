const sanitizeHtml = require("sanitize-html");

// Allowlist derived from TipTap extensions actually loaded in tiptapExtensions.js.
// If a new extension is added, update this list to match what it emits.

const ALLOWED_TAGS = [
    // block
    "p", "br", "hr",
    "h1", "h2", "h3", "h4", "h5", "h6",
    "blockquote",
    "ul", "ol", "li",
    "pre", "code",
    // inline
    "strong", "em", "s", "u",
    "mark",
    "a",
    "span",
    // media
    "img",
    // youtube extension: <div data-youtube-video><iframe ...></iframe></div>
    "div", "iframe",
    // custom embed node — rendered client-side, code attr untouched here
    "btw-embed",
];

const ALLOWED_ATTRIBUTES = {
    // Link extension: always emits target="_blank" rel="noopener noreferrer nofollow"
    a: ["href", "target", "rel"],
    // Image extension
    img: ["src", "alt", "title"],
    // CodeBlockLowlight: class is always "language-<name>"
    code: ["class"],
    // Highlight extension with color
    mark: ["data-color", "style"],
    // Mention extension
    span: ["class", "data-id", "data-label"],
    // TaskList / TaskItem
    ul: ["data-type"],
    li: ["data-type", "data-checked"],
    // Youtube wrapper div
    div: ["data-youtube-video"],
    // Youtube iframe
    iframe: ["src", "frameborder", "allowfullscreen", "allow"],
    // Custom embed — code attribute contains third-party embed HTML, rendered in srcdoc iframe
    "btw-embed": ["code"],
};

function sanitizeNoteHtml(html) {
    return sanitizeHtml(html, {
        allowedTags: ALLOWED_TAGS,
        allowedAttributes: ALLOWED_ATTRIBUTES,
        // img src: http and https — blocks data: URIs and javascript: URLs
        allowedSchemesByTag: {
            img: ["http", "https"],
        },
        // iframe src: YouTube only — strip src if not YouTube, then drop the empty tag
        allowedIframeHostnames: ["www.youtube.com", "www.youtube-nocookie.com"],
        exclusiveFilter: (frame) => frame.tag === "iframe" && !frame.attribs.src,
        // mark style: background-color only (Highlight extension with color)
        allowedStyles: {
            mark: {
                "background-color": [/^.+$/],
            },
        },
    });
}

module.exports = { sanitizeNoteHtml };
