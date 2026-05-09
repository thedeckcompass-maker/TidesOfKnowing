globalThis.process ??= {}; globalThis.process.env ??= {};
const textEncoder = new TextEncoder();

const base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

// Use a lookup table to find the index.
const base64Lookup = new Uint8Array(256);
for (let i = 0; i < base64Chars.length; i++) {
    base64Lookup[base64Chars.charCodeAt(i)] = i;
}

function decodeBase64(base64) {
    let bufferLength = Math.ceil(base64.length / 4) * 3;
    const len = base64.length;

    let p = 0;

    if (base64.length % 4 === 3) {
        bufferLength--;
    } else if (base64.length % 4 === 2) {
        bufferLength -= 2;
    } else if (base64[base64.length - 1] === '=') {
        bufferLength--;
        if (base64[base64.length - 2] === '=') {
            bufferLength--;
        }
    }

    const arrayBuffer = new ArrayBuffer(bufferLength);
    const bytes = new Uint8Array(arrayBuffer);

    for (let i = 0; i < len; i += 4) {
        let encoded1 = base64Lookup[base64.charCodeAt(i)];
        let encoded2 = base64Lookup[base64.charCodeAt(i + 1)];
        let encoded3 = base64Lookup[base64.charCodeAt(i + 2)];
        let encoded4 = base64Lookup[base64.charCodeAt(i + 3)];

        bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
        bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
        bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
    }

    return arrayBuffer;
}

function getDecoder(charset) {
    charset = charset || 'utf8';
    let decoder;

    try {
        decoder = new TextDecoder(charset);
    } catch (err) {
        decoder = new TextDecoder('windows-1252');
    }

    return decoder;
}

/**
 * Converts a Blob into an ArrayBuffer
 * @param {Blob} blob Blob to convert
 * @returns {ArrayBuffer} Converted value
 */
async function blobToArrayBuffer(blob) {
    if ('arrayBuffer' in blob) {
        return await blob.arrayBuffer();
    }

    const fr = new FileReader();

    return new Promise((resolve, reject) => {
        fr.onload = function (e) {
            resolve(e.target.result);
        };

        fr.onerror = function (e) {
            reject(fr.error);
        };

        fr.readAsArrayBuffer(blob);
    });
}

function getHex(c) {
    if (
        (c >= 0x30 /* 0 */ && c <= 0x39) /* 9 */ ||
        (c >= 0x61 /* a */ && c <= 0x66) /* f */ ||
        (c >= 0x41 /* A */ && c <= 0x46) /* F */
    ) {
        return String.fromCharCode(c);
    }
    return false;
}

/**
 * Decode a complete mime word encoded string
 *
 * @param {String} str Mime word encoded string
 * @return {String} Decoded unicode string
 */
function decodeWord(charset, encoding, str) {
    // RFC2231 added language tag to the encoding
    // see: https://tools.ietf.org/html/rfc2231#section-5
    // this implementation silently ignores this tag
    let splitPos = charset.indexOf('*');
    if (splitPos >= 0) {
        charset = charset.substr(0, splitPos);
    }

    encoding = encoding.toUpperCase();

    let byteStr;

    if (encoding === 'Q') {
        str = str
            // remove spaces between = and hex char, this might indicate invalidly applied line splitting
            .replace(/=\s+([0-9a-fA-F])/g, '=$1')
            // convert all underscores to spaces
            .replace(/[_\s]/g, ' ');

        let buf = textEncoder.encode(str);
        let encodedBytes = [];
        for (let i = 0, len = buf.length; i < len; i++) {
            let c = buf[i];
            if (i <= len - 2 && c === 0x3d /* = */) {
                let c1 = getHex(buf[i + 1]);
                let c2 = getHex(buf[i + 2]);
                if (c1 && c2) {
                    let c = parseInt(c1 + c2, 16);
                    encodedBytes.push(c);
                    i += 2;
                    continue;
                }
            }
            encodedBytes.push(c);
        }
        byteStr = new ArrayBuffer(encodedBytes.length);
        let dataView = new DataView(byteStr);
        for (let i = 0, len = encodedBytes.length; i < len; i++) {
            dataView.setUint8(i, encodedBytes[i]);
        }
    } else if (encoding === 'B') {
        byteStr = decodeBase64(str.replace(/[^a-zA-Z0-9\+\/=]+/g, ''));
    } else {
        // keep as is, convert ArrayBuffer to unicode string, assume utf8
        byteStr = textEncoder.encode(str);
    }

    return getDecoder(charset).decode(byteStr);
}

function decodeWords(str) {
    let joinString = true;

    while (true) {
        let result = (str || '')
            .toString()
            // find base64 words that can be joined
            .replace(
                /(=\?([^?]+)\?[Bb]\?([^?]*)\?=)\s*(?==\?([^?]+)\?[Bb]\?[^?]*\?=)/g,
                (match, left, chLeft, encodedLeftStr, chRight) => {
                    if (!joinString) {
                        return match;
                    }
                    // only mark b64 chunks to be joined if charsets match and left side does not end with =
                    if (chLeft === chRight && encodedLeftStr.length % 4 === 0 && !/=$/.test(encodedLeftStr)) {
                        // set a joiner marker
                        return left + '__\x00JOIN\x00__';
                    }

                    return match;
                }
            )
            // find QP words that can be joined
            .replace(
                /(=\?([^?]+)\?[Qq]\?[^?]*\?=)\s*(?==\?([^?]+)\?[Qq]\?[^?]*\?=)/g,
                (match, left, chLeft, chRight) => {
                    if (!joinString) {
                        return match;
                    }
                    // only mark QP chunks to be joined if charsets match
                    if (chLeft === chRight) {
                        // set a joiner marker
                        return left + '__\x00JOIN\x00__';
                    }
                    return match;
                }
            )
            // join base64 encoded words
            .replace(/(\?=)?__\x00JOIN\x00__(=\?([^?]+)\?[QqBb]\?)?/g, '')
            // remove spaces between mime encoded words
            .replace(/(=\?[^?]+\?[QqBb]\?[^?]*\?=)\s+(?==\?[^?]+\?[QqBb]\?[^?]*\?=)/g, '$1')
            // decode words
            .replace(/=\?([\w_\-*]+)\?([QqBb])\?([^?]*)\?=/g, (m, charset, encoding, text) =>
                decodeWord(charset, encoding, text)
            );

        if (joinString && result.indexOf('\ufffd') >= 0) {
            // text contains \ufffd (EF BF BD), so unicode conversion failed, retry without joining strings
            joinString = false;
        } else {
            return result;
        }
    }
}

function decodeURIComponentWithCharset(encodedStr, charset) {
    charset = charset || 'utf-8';

    let encodedBytes = [];
    for (let i = 0; i < encodedStr.length; i++) {
        let c = encodedStr.charAt(i);
        if (c === '%' && /^[a-f0-9]{2}/i.test(encodedStr.substr(i + 1, 2))) {
            // encoded sequence
            let byte = encodedStr.substr(i + 1, 2);
            i += 2;
            encodedBytes.push(parseInt(byte, 16));
        } else if (c.charCodeAt(0) > 126) {
            c = textEncoder.encode(c);
            for (let j = 0; j < c.length; j++) {
                encodedBytes.push(c[j]);
            }
        } else {
            // "normal" char
            encodedBytes.push(c.charCodeAt(0));
        }
    }

    const byteStr = new ArrayBuffer(encodedBytes.length);
    const dataView = new DataView(byteStr);
    for (let i = 0, len = encodedBytes.length; i < len; i++) {
        dataView.setUint8(i, encodedBytes[i]);
    }

    return getDecoder(charset).decode(byteStr);
}

function decodeParameterValueContinuations(header) {
    // handle parameter value continuations
    // https://tools.ietf.org/html/rfc2231#section-3

    // preprocess values
    let paramKeys = new Map();

    Object.keys(header.params).forEach(key => {
        let match = key.match(/\*((\d+)\*?)?$/);
        if (!match) {
            // nothing to do here, does not seem like a continuation param
            return;
        }

        let actualKey = key.substr(0, match.index).toLowerCase();
        let nr = Number(match[2]) || 0;

        let paramVal;
        if (!paramKeys.has(actualKey)) {
            paramVal = {
                charset: false,
                values: []
            };
            paramKeys.set(actualKey, paramVal);
        } else {
            paramVal = paramKeys.get(actualKey);
        }

        let value = header.params[key];
        if (nr === 0 && match[0].charAt(match[0].length - 1) === '*' && (match = value.match(/^([^']*)'[^']*'(.*)$/))) {
            paramVal.charset = match[1] || 'utf-8';
            value = match[2];
        }

        paramVal.values.push({ nr, value });

        // remove the old reference
        delete header.params[key];
    });

    paramKeys.forEach((paramVal, key) => {
        header.params[key] = decodeURIComponentWithCharset(
            paramVal.values
                .sort((a, b) => a.nr - b.nr)
                .map(a => a.value)
                .join(''),
            paramVal.charset
        );
    });
}

class PassThroughDecoder {
    constructor() {
        this.chunks = [];
    }

    update(line) {
        this.chunks.push(line);
        this.chunks.push('\n');
    }

    finalize() {
        // convert an array of arraybuffers into a blob and then back into a single arraybuffer
        return blobToArrayBuffer(new Blob(this.chunks, { type: 'application/octet-stream' }));
    }
}

class Base64Decoder {
    constructor(opts) {
        opts = opts || {};

        this.decoder = opts.decoder || new TextDecoder();

        this.maxChunkSize = 100 * 1024;

        this.chunks = [];

        this.remainder = '';
    }

    update(buffer) {
        let str = this.decoder.decode(buffer);

        str = str.replace(/[^a-zA-Z0-9+\/]+/g, '');

        this.remainder += str;

        if (this.remainder.length >= this.maxChunkSize) {
            let allowedBytes = Math.floor(this.remainder.length / 4) * 4;
            let base64Str;

            if (allowedBytes === this.remainder.length) {
                base64Str = this.remainder;
                this.remainder = '';
            } else {
                base64Str = this.remainder.substr(0, allowedBytes);
                this.remainder = this.remainder.substr(allowedBytes);
            }

            if (base64Str.length) {
                this.chunks.push(decodeBase64(base64Str));
            }
        }
    }

    finalize() {
        if (this.remainder && !/^=+$/.test(this.remainder)) {
            this.chunks.push(decodeBase64(this.remainder));
        }

        return blobToArrayBuffer(new Blob(this.chunks, { type: 'application/octet-stream' }));
    }
}

// Regex patterns compiled once for performance
const VALID_QP_REGEX = /^=[a-f0-9]{2}$/i;
const QP_SPLIT_REGEX = /(?==[a-f0-9]{2})/i;
const SOFT_LINE_BREAK_REGEX = /=\r?\n/g;
const PARTIAL_QP_ENDING_REGEX = /=[a-fA-F0-9]?$/;

class QPDecoder {
    constructor(opts) {
        opts = opts || {};

        this.decoder = opts.decoder || new TextDecoder();

        this.maxChunkSize = 100 * 1024;

        this.remainder = '';

        this.chunks = [];
    }

    decodeQPBytes(encodedBytes) {
        let buf = new ArrayBuffer(encodedBytes.length);
        let dataView = new DataView(buf);
        for (let i = 0, len = encodedBytes.length; i < len; i++) {
            dataView.setUint8(i, parseInt(encodedBytes[i], 16));
        }
        return buf;
    }

    decodeChunks(str) {
        // unwrap newlines
        str = str.replace(SOFT_LINE_BREAK_REGEX, '');

        let list = str.split(QP_SPLIT_REGEX);
        let encodedBytes = [];
        for (let part of list) {
            if (part.charAt(0) !== '=') {
                if (encodedBytes.length) {
                    this.chunks.push(this.decodeQPBytes(encodedBytes));
                    encodedBytes = [];
                }
                this.chunks.push(part);
                continue;
            }

            if (part.length === 3) {
                // Validate that this is actually a valid QP sequence
                if (VALID_QP_REGEX.test(part)) {
                    encodedBytes.push(part.substr(1));
                } else {
                    // Not a valid QP sequence, treat as literal text
                    if (encodedBytes.length) {
                        this.chunks.push(this.decodeQPBytes(encodedBytes));
                        encodedBytes = [];
                    }
                    this.chunks.push(part);
                }
                continue;
            }

            if (part.length > 3) {
                // First 3 chars should be a valid QP sequence
                const firstThree = part.substr(0, 3);
                if (VALID_QP_REGEX.test(firstThree)) {
                    encodedBytes.push(part.substr(1, 2));
                    this.chunks.push(this.decodeQPBytes(encodedBytes));
                    encodedBytes = [];

                    part = part.substr(3);
                    this.chunks.push(part);
                } else {
                    // Not a valid QP sequence, treat entire part as literal
                    if (encodedBytes.length) {
                        this.chunks.push(this.decodeQPBytes(encodedBytes));
                        encodedBytes = [];
                    }
                    this.chunks.push(part);
                }
            }
        }
        if (encodedBytes.length) {
            this.chunks.push(this.decodeQPBytes(encodedBytes));
        }
    }

    update(buffer) {
        // expect full lines, so add line terminator as well
        let str = this.decoder.decode(buffer) + '\n';

        str = this.remainder + str;

        if (str.length < this.maxChunkSize) {
            this.remainder = str;
            return;
        }

        this.remainder = '';

        let partialEnding = str.match(PARTIAL_QP_ENDING_REGEX);
        if (partialEnding) {
            if (partialEnding.index === 0) {
                this.remainder = str;
                return;
            }
            this.remainder = str.substr(partialEnding.index);
            str = str.substr(0, partialEnding.index);
        }

        this.decodeChunks(str);
    }

    finalize() {
        if (this.remainder.length) {
            this.decodeChunks(this.remainder);
            this.remainder = '';
        }

        // convert an array of arraybuffers into a blob and then back into a single arraybuffer
        return blobToArrayBuffer(new Blob(this.chunks, { type: 'application/octet-stream' }));
    }
}

const defaultDecoder = getDecoder();

class MimeNode {
    constructor(options) {
        this.options = options || {};

        this.postalMime = this.options.postalMime;

        this.root = !!this.options.parentNode;
        this.childNodes = [];

        if (this.options.parentNode) {
            this.parentNode = this.options.parentNode;

            this.depth = this.parentNode.depth + 1;
            if (this.depth > this.options.maxNestingDepth) {
                throw new Error(`Maximum MIME nesting depth of ${this.options.maxNestingDepth} levels exceeded`);
            }

            this.options.parentNode.childNodes.push(this);
        } else {
            this.depth = 0;
        }

        this.state = 'header';

        this.headerLines = [];
        this.headerSize = 0;

        // RFC 2046 Section 5.1.5: multipart/digest defaults to message/rfc822
        const parentMultipartType = this.options.parentMultipartType || null;
        const defaultContentType = parentMultipartType === 'digest' ? 'message/rfc822' : 'text/plain';

        this.contentType = {
            value: defaultContentType,
            default: true
        };

        this.contentTransferEncoding = {
            value: '8bit'
        };

        this.contentDisposition = {
            value: ''
        };

        this.headers = [];

        this.contentDecoder = false;
    }

    setupContentDecoder(transferEncoding) {
        if (/base64/i.test(transferEncoding)) {
            this.contentDecoder = new Base64Decoder();
        } else if (/quoted-printable/i.test(transferEncoding)) {
            this.contentDecoder = new QPDecoder({ decoder: getDecoder(this.contentType.parsed.params.charset) });
        } else {
            this.contentDecoder = new PassThroughDecoder();
        }
    }

    async finalize() {
        if (this.state === 'finished') {
            return;
        }

        if (this.state === 'header') {
            this.processHeaders();
        }

        // remove self from boundary listing
        let boundaries = this.postalMime.boundaries;
        for (let i = boundaries.length - 1; i >= 0; i--) {
            let boundary = boundaries[i];
            if (boundary.node === this) {
                boundaries.splice(i, 1);
                break;
            }
        }

        await this.finalizeChildNodes();

        this.content = this.contentDecoder ? await this.contentDecoder.finalize() : null;

        this.state = 'finished';
    }

    async finalizeChildNodes() {
        for (let childNode of this.childNodes) {
            await childNode.finalize();
        }
    }

    // Strip RFC 822 comments (parenthesized text) from structured header values
    stripComments(str) {
        let result = '';
        let depth = 0;
        let escaped = false;
        let inQuote = false;

        for (let i = 0; i < str.length; i++) {
            const chr = str.charAt(i);

            if (escaped) {
                if (depth === 0) {
                    result += chr;
                }
                escaped = false;
                continue;
            }

            if (chr === '\\') {
                escaped = true;
                if (depth === 0) {
                    result += chr;
                }
                continue;
            }

            if (chr === '"' && depth === 0) {
                inQuote = !inQuote;
                result += chr;
                continue;
            }

            if (!inQuote) {
                if (chr === '(') {
                    depth++;
                    continue;
                }
                if (chr === ')' && depth > 0) {
                    depth--;
                    continue;
                }
            }

            if (depth === 0) {
                result += chr;
            }
        }

        return result;
    }

    parseStructuredHeader(str) {
        // Strip RFC 822 comments before parsing
        str = this.stripComments(str);

        let response = {
            value: false,
            params: {}
        };

        let key = false;
        let value = '';
        let stage = 'value';

        let quote = false;
        let escaped = false;
        let chr;

        for (let i = 0, len = str.length; i < len; i++) {
            chr = str.charAt(i);
            switch (stage) {
                case 'key':
                    if (chr === '=') {
                        key = value.trim().toLowerCase();
                        stage = 'value';
                        value = '';
                        break;
                    }
                    value += chr;
                    break;
                case 'value':
                    if (escaped) {
                        value += chr;
                    } else if (chr === '\\') {
                        escaped = true;
                        continue;
                    } else if (quote && chr === quote) {
                        quote = false;
                    } else if (!quote && chr === '"') {
                        quote = chr;
                    } else if (!quote && chr === ';') {
                        if (key === false) {
                            response.value = value.trim();
                        } else {
                            response.params[key] = value.trim();
                        }
                        stage = 'key';
                        value = '';
                    } else {
                        value += chr;
                    }
                    escaped = false;
                    break;
            }
        }

        // finalize remainder
        value = value.trim();
        if (stage === 'value') {
            if (key === false) {
                // default value
                response.value = value;
            } else {
                // subkey value
                response.params[key] = value;
            }
        } else if (value) {
            // treat as key without value, see emptykey:
            // Header-Key: somevalue; key=value; emptykey
            response.params[value.toLowerCase()] = '';
        }

        if (response.value) {
            response.value = response.value.toLowerCase();
        }

        // convert Parameter Value Continuations into single strings
        decodeParameterValueContinuations(response);

        return response;
    }

    decodeFlowedText(str, delSp) {
        return (
            str
                .split(/\r?\n/)
                // remove soft linebreaks
                // soft linebreaks are added after space symbols
                .reduce((previousValue, currentValue) => {
                    if (previousValue.endsWith(' ') && previousValue !== '-- ' && !previousValue.endsWith('\n-- ')) {
                        if (delSp) {
                            // delsp adds space to text to be able to fold it
                            // these spaces can be removed once the text is unfolded
                            return previousValue.slice(0, -1) + currentValue;
                        } else {
                            return previousValue + currentValue;
                        }
                    } else {
                        return previousValue + '\n' + currentValue;
                    }
                })
                // remove whitespace stuffing
                // http://tools.ietf.org/html/rfc3676#section-4.4
                .replace(/^ /gm, '')
        );
    }

    getTextContent() {
        if (!this.content) {
            return '';
        }

        let str = getDecoder(this.contentType.parsed.params.charset).decode(this.content);

        if (/^flowed$/i.test(this.contentType.parsed.params.format)) {
            str = this.decodeFlowedText(str, /^yes$/i.test(this.contentType.parsed.params.delsp));
        }

        return str;
    }

    processHeaders() {
        // First pass: merge folded headers (backward iteration)
        for (let i = this.headerLines.length - 1; i >= 0; i--) {
            let line = this.headerLines[i];
            if (i && /^\s/.test(line)) {
                this.headerLines[i - 1] += '\n' + line;
                this.headerLines.splice(i, 1);
            }
        }

        // Initialize rawHeaderLines to store unmodified lines
        this.rawHeaderLines = [];

        // Second pass: process headers (MUST be backward to maintain this.headers order)
        // The existing code iterates backward and postal-mime.js calls .reverse()
        // We must preserve this behavior to avoid breaking changes
        for (let i = this.headerLines.length - 1; i >= 0; i--) {
            let rawLine = this.headerLines[i];

            // Extract key from raw line for rawHeaderLines
            let sep = rawLine.indexOf(':');
            let rawKey = sep < 0 ? rawLine.trim() : rawLine.substr(0, sep).trim();

            // Store raw line with lowercase key
            this.rawHeaderLines.push({
                key: rawKey.toLowerCase(),
                line: rawLine
            });

            // Normalize for this.headers (existing behavior - order preserved)
            let normalizedLine = rawLine.replace(/\s+/g, ' ');
            sep = normalizedLine.indexOf(':');
            let key = sep < 0 ? normalizedLine.trim() : normalizedLine.substr(0, sep).trim();
            let value = sep < 0 ? '' : normalizedLine.substr(sep + 1).trim();
            this.headers.push({ key: key.toLowerCase(), originalKey: key, value });

            switch (key.toLowerCase()) {
                case 'content-type':
                    if (this.contentType.default) {
                        this.contentType = { value, parsed: {} };
                    }
                    break;
                case 'content-transfer-encoding':
                    this.contentTransferEncoding = { value, parsed: {} };
                    break;
                case 'content-disposition':
                    this.contentDisposition = { value, parsed: {} };
                    break;
                case 'content-id':
                    this.contentId = value;
                    break;
                case 'content-description':
                    this.contentDescription = value;
                    break;
            }
        }

        this.contentType.parsed = this.parseStructuredHeader(this.contentType.value);
        this.contentType.multipart = /^multipart\//i.test(this.contentType.parsed.value)
            ? this.contentType.parsed.value.substr(this.contentType.parsed.value.indexOf('/') + 1)
            : false;

        if (this.contentType.multipart && this.contentType.parsed.params.boundary) {
            // add self to boundary terminator listing
            this.postalMime.boundaries.push({
                value: textEncoder.encode(this.contentType.parsed.params.boundary),
                node: this
            });
        }

        this.contentDisposition.parsed = this.parseStructuredHeader(this.contentDisposition.value);

        this.contentTransferEncoding.encoding = this.contentTransferEncoding.value
            .toLowerCase()
            .split(/[^\w-]/)
            .shift();

        this.setupContentDecoder(this.contentTransferEncoding.encoding);
    }

    feed(line) {
        switch (this.state) {
            case 'header':
                if (!line.length) {
                    this.state = 'body';
                    return this.processHeaders();
                }

                this.headerSize += line.length;

                if (this.headerSize > this.options.maxHeadersSize) {
                    let error = new Error(`Maximum header size of ${this.options.maxHeadersSize} bytes exceeded`);
                    throw error;
                }

                this.headerLines.push(defaultDecoder.decode(line));
                break;
            case 'body': {
                // add line to body
                this.contentDecoder.update(line);
            }
        }
    }
}

// Entity map from https://html.spec.whatwg.org/multipage/named-characters.html#named-character-references
const htmlEntities = {
    '&AElig': '\u00C6',
    '&AElig;': '\u00C6',
    '&AMP': '\u0026',
    '&AMP;': '\u0026',
    '&Aacute': '\u00C1',
    '&Aacute;': '\u00C1',
    '&Abreve;': '\u0102',
    '&Acirc': '\u00C2',
    '&Acirc;': '\u00C2',
    '&Acy;': '\u0410',
    '&Afr;': '\uD835\uDD04',
    '&Agrave': '\u00C0',
    '&Agrave;': '\u00C0',
    '&Alpha;': '\u0391',
    '&Amacr;': '\u0100',
    '&And;': '\u2A53',
    '&Aogon;': '\u0104',
    '&Aopf;': '\uD835\uDD38',
    '&ApplyFunction;': '\u2061',
    '&Aring': '\u00C5',
    '&Aring;': '\u00C5',
    '&Ascr;': '\uD835\uDC9C',
    '&Assign;': '\u2254',
    '&Atilde': '\u00C3',
    '&Atilde;': '\u00C3',
    '&Auml': '\u00C4',
    '&Auml;': '\u00C4',
    '&Backslash;': '\u2216',
    '&Barv;': '\u2AE7',
    '&Barwed;': '\u2306',
    '&Bcy;': '\u0411',
    '&Because;': '\u2235',
    '&Bernoullis;': '\u212C',
    '&Beta;': '\u0392',
    '&Bfr;': '\uD835\uDD05',
    '&Bopf;': '\uD835\uDD39',
    '&Breve;': '\u02D8',
    '&Bscr;': '\u212C',
    '&Bumpeq;': '\u224E',
    '&CHcy;': '\u0427',
    '&COPY': '\u00A9',
    '&COPY;': '\u00A9',
    '&Cacute;': '\u0106',
    '&Cap;': '\u22D2',
    '&CapitalDifferentialD;': '\u2145',
    '&Cayleys;': '\u212D',
    '&Ccaron;': '\u010C',
    '&Ccedil': '\u00C7',
    '&Ccedil;': '\u00C7',
    '&Ccirc;': '\u0108',
    '&Cconint;': '\u2230',
    '&Cdot;': '\u010A',
    '&Cedilla;': '\u00B8',
    '&CenterDot;': '\u00B7',
    '&Cfr;': '\u212D',
    '&Chi;': '\u03A7',
    '&CircleDot;': '\u2299',
    '&CircleMinus;': '\u2296',
    '&CirclePlus;': '\u2295',
    '&CircleTimes;': '\u2297',
    '&ClockwiseContourIntegral;': '\u2232',
    '&CloseCurlyDoubleQuote;': '\u201D',
    '&CloseCurlyQuote;': '\u2019',
    '&Colon;': '\u2237',
    '&Colone;': '\u2A74',
    '&Congruent;': '\u2261',
    '&Conint;': '\u222F',
    '&ContourIntegral;': '\u222E',
    '&Copf;': '\u2102',
    '&Coproduct;': '\u2210',
    '&CounterClockwiseContourIntegral;': '\u2233',
    '&Cross;': '\u2A2F',
    '&Cscr;': '\uD835\uDC9E',
    '&Cup;': '\u22D3',
    '&CupCap;': '\u224D',
    '&DD;': '\u2145',
    '&DDotrahd;': '\u2911',
    '&DJcy;': '\u0402',
    '&DScy;': '\u0405',
    '&DZcy;': '\u040F',
    '&Dagger;': '\u2021',
    '&Darr;': '\u21A1',
    '&Dashv;': '\u2AE4',
    '&Dcaron;': '\u010E',
    '&Dcy;': '\u0414',
    '&Del;': '\u2207',
    '&Delta;': '\u0394',
    '&Dfr;': '\uD835\uDD07',
    '&DiacriticalAcute;': '\u00B4',
    '&DiacriticalDot;': '\u02D9',
    '&DiacriticalDoubleAcute;': '\u02DD',
    '&DiacriticalGrave;': '\u0060',
    '&DiacriticalTilde;': '\u02DC',
    '&Diamond;': '\u22C4',
    '&DifferentialD;': '\u2146',
    '&Dopf;': '\uD835\uDD3B',
    '&Dot;': '\u00A8',
    '&DotDot;': '\u20DC',
    '&DotEqual;': '\u2250',
    '&DoubleContourIntegral;': '\u222F',
    '&DoubleDot;': '\u00A8',
    '&DoubleDownArrow;': '\u21D3',
    '&DoubleLeftArrow;': '\u21D0',
    '&DoubleLeftRightArrow;': '\u21D4',
    '&DoubleLeftTee;': '\u2AE4',
    '&DoubleLongLeftArrow;': '\u27F8',
    '&DoubleLongLeftRightArrow;': '\u27FA',
    '&DoubleLongRightArrow;': '\u27F9',
    '&DoubleRightArrow;': '\u21D2',
    '&DoubleRightTee;': '\u22A8',
    '&DoubleUpArrow;': '\u21D1',
    '&DoubleUpDownArrow;': '\u21D5',
    '&DoubleVerticalBar;': '\u2225',
    '&DownArrow;': '\u2193',
    '&DownArrowBar;': '\u2913',
    '&DownArrowUpArrow;': '\u21F5',
    '&DownBreve;': '\u0311',
    '&DownLeftRightVector;': '\u2950',
    '&DownLeftTeeVector;': '\u295E',
    '&DownLeftVector;': '\u21BD',
    '&DownLeftVectorBar;': '\u2956',
    '&DownRightTeeVector;': '\u295F',
    '&DownRightVector;': '\u21C1',
    '&DownRightVectorBar;': '\u2957',
    '&DownTee;': '\u22A4',
    '&DownTeeArrow;': '\u21A7',
    '&Downarrow;': '\u21D3',
    '&Dscr;': '\uD835\uDC9F',
    '&Dstrok;': '\u0110',
    '&ENG;': '\u014A',
    '&ETH': '\u00D0',
    '&ETH;': '\u00D0',
    '&Eacute': '\u00C9',
    '&Eacute;': '\u00C9',
    '&Ecaron;': '\u011A',
    '&Ecirc': '\u00CA',
    '&Ecirc;': '\u00CA',
    '&Ecy;': '\u042D',
    '&Edot;': '\u0116',
    '&Efr;': '\uD835\uDD08',
    '&Egrave': '\u00C8',
    '&Egrave;': '\u00C8',
    '&Element;': '\u2208',
    '&Emacr;': '\u0112',
    '&EmptySmallSquare;': '\u25FB',
    '&EmptyVerySmallSquare;': '\u25AB',
    '&Eogon;': '\u0118',
    '&Eopf;': '\uD835\uDD3C',
    '&Epsilon;': '\u0395',
    '&Equal;': '\u2A75',
    '&EqualTilde;': '\u2242',
    '&Equilibrium;': '\u21CC',
    '&Escr;': '\u2130',
    '&Esim;': '\u2A73',
    '&Eta;': '\u0397',
    '&Euml': '\u00CB',
    '&Euml;': '\u00CB',
    '&Exists;': '\u2203',
    '&ExponentialE;': '\u2147',
    '&Fcy;': '\u0424',
    '&Ffr;': '\uD835\uDD09',
    '&FilledSmallSquare;': '\u25FC',
    '&FilledVerySmallSquare;': '\u25AA',
    '&Fopf;': '\uD835\uDD3D',
    '&ForAll;': '\u2200',
    '&Fouriertrf;': '\u2131',
    '&Fscr;': '\u2131',
    '&GJcy;': '\u0403',
    '&GT': '\u003E',
    '&GT;': '\u003E',
    '&Gamma;': '\u0393',
    '&Gammad;': '\u03DC',
    '&Gbreve;': '\u011E',
    '&Gcedil;': '\u0122',
    '&Gcirc;': '\u011C',
    '&Gcy;': '\u0413',
    '&Gdot;': '\u0120',
    '&Gfr;': '\uD835\uDD0A',
    '&Gg;': '\u22D9',
    '&Gopf;': '\uD835\uDD3E',
    '&GreaterEqual;': '\u2265',
    '&GreaterEqualLess;': '\u22DB',
    '&GreaterFullEqual;': '\u2267',
    '&GreaterGreater;': '\u2AA2',
    '&GreaterLess;': '\u2277',
    '&GreaterSlantEqual;': '\u2A7E',
    '&GreaterTilde;': '\u2273',
    '&Gscr;': '\uD835\uDCA2',
    '&Gt;': '\u226B',
    '&HARDcy;': '\u042A',
    '&Hacek;': '\u02C7',
    '&Hat;': '\u005E',
    '&Hcirc;': '\u0124',
    '&Hfr;': '\u210C',
    '&HilbertSpace;': '\u210B',
    '&Hopf;': '\u210D',
    '&HorizontalLine;': '\u2500',
    '&Hscr;': '\u210B',
    '&Hstrok;': '\u0126',
    '&HumpDownHump;': '\u224E',
    '&HumpEqual;': '\u224F',
    '&IEcy;': '\u0415',
    '&IJlig;': '\u0132',
    '&IOcy;': '\u0401',
    '&Iacute': '\u00CD',
    '&Iacute;': '\u00CD',
    '&Icirc': '\u00CE',
    '&Icirc;': '\u00CE',
    '&Icy;': '\u0418',
    '&Idot;': '\u0130',
    '&Ifr;': '\u2111',
    '&Igrave': '\u00CC',
    '&Igrave;': '\u00CC',
    '&Im;': '\u2111',
    '&Imacr;': '\u012A',
    '&ImaginaryI;': '\u2148',
    '&Implies;': '\u21D2',
    '&Int;': '\u222C',
    '&Integral;': '\u222B',
    '&Intersection;': '\u22C2',
    '&InvisibleComma;': '\u2063',
    '&InvisibleTimes;': '\u2062',
    '&Iogon;': '\u012E',
    '&Iopf;': '\uD835\uDD40',
    '&Iota;': '\u0399',
    '&Iscr;': '\u2110',
    '&Itilde;': '\u0128',
    '&Iukcy;': '\u0406',
    '&Iuml': '\u00CF',
    '&Iuml;': '\u00CF',
    '&Jcirc;': '\u0134',
    '&Jcy;': '\u0419',
    '&Jfr;': '\uD835\uDD0D',
    '&Jopf;': '\uD835\uDD41',
    '&Jscr;': '\uD835\uDCA5',
    '&Jsercy;': '\u0408',
    '&Jukcy;': '\u0404',
    '&KHcy;': '\u0425',
    '&KJcy;': '\u040C',
    '&Kappa;': '\u039A',
    '&Kcedil;': '\u0136',
    '&Kcy;': '\u041A',
    '&Kfr;': '\uD835\uDD0E',
    '&Kopf;': '\uD835\uDD42',
    '&Kscr;': '\uD835\uDCA6',
    '&LJcy;': '\u0409',
    '&LT': '\u003C',
    '&LT;': '\u003C',
    '&Lacute;': '\u0139',
    '&Lambda;': '\u039B',
    '&Lang;': '\u27EA',
    '&Laplacetrf;': '\u2112',
    '&Larr;': '\u219E',
    '&Lcaron;': '\u013D',
    '&Lcedil;': '\u013B',
    '&Lcy;': '\u041B',
    '&LeftAngleBracket;': '\u27E8',
    '&LeftArrow;': '\u2190',
    '&LeftArrowBar;': '\u21E4',
    '&LeftArrowRightArrow;': '\u21C6',
    '&LeftCeiling;': '\u2308',
    '&LeftDoubleBracket;': '\u27E6',
    '&LeftDownTeeVector;': '\u2961',
    '&LeftDownVector;': '\u21C3',
    '&LeftDownVectorBar;': '\u2959',
    '&LeftFloor;': '\u230A',
    '&LeftRightArrow;': '\u2194',
    '&LeftRightVector;': '\u294E',
    '&LeftTee;': '\u22A3',
    '&LeftTeeArrow;': '\u21A4',
    '&LeftTeeVector;': '\u295A',
    '&LeftTriangle;': '\u22B2',
    '&LeftTriangleBar;': '\u29CF',
    '&LeftTriangleEqual;': '\u22B4',
    '&LeftUpDownVector;': '\u2951',
    '&LeftUpTeeVector;': '\u2960',
    '&LeftUpVector;': '\u21BF',
    '&LeftUpVectorBar;': '\u2958',
    '&LeftVector;': '\u21BC',
    '&LeftVectorBar;': '\u2952',
    '&Leftarrow;': '\u21D0',
    '&Leftrightarrow;': '\u21D4',
    '&LessEqualGreater;': '\u22DA',
    '&LessFullEqual;': '\u2266',
    '&LessGreater;': '\u2276',
    '&LessLess;': '\u2AA1',
    '&LessSlantEqual;': '\u2A7D',
    '&LessTilde;': '\u2272',
    '&Lfr;': '\uD835\uDD0F',
    '&Ll;': '\u22D8',
    '&Lleftarrow;': '\u21DA',
    '&Lmidot;': '\u013F',
    '&LongLeftArrow;': '\u27F5',
    '&LongLeftRightArrow;': '\u27F7',
    '&LongRightArrow;': '\u27F6',
    '&Longleftarrow;': '\u27F8',
    '&Longleftrightarrow;': '\u27FA',
    '&Longrightarrow;': '\u27F9',
    '&Lopf;': '\uD835\uDD43',
    '&LowerLeftArrow;': '\u2199',
    '&LowerRightArrow;': '\u2198',
    '&Lscr;': '\u2112',
    '&Lsh;': '\u21B0',
    '&Lstrok;': '\u0141',
    '&Lt;': '\u226A',
    '&Map;': '\u2905',
    '&Mcy;': '\u041C',
    '&MediumSpace;': '\u205F',
    '&Mellintrf;': '\u2133',
    '&Mfr;': '\uD835\uDD10',
    '&MinusPlus;': '\u2213',
    '&Mopf;': '\uD835\uDD44',
    '&Mscr;': '\u2133',
    '&Mu;': '\u039C',
    '&NJcy;': '\u040A',
    '&Nacute;': '\u0143',
    '&Ncaron;': '\u0147',
    '&Ncedil;': '\u0145',
    '&Ncy;': '\u041D',
    '&NegativeMediumSpace;': '\u200B',
    '&NegativeThickSpace;': '\u200B',
    '&NegativeThinSpace;': '\u200B',
    '&NegativeVeryThinSpace;': '\u200B',
    '&NestedGreaterGreater;': '\u226B',
    '&NestedLessLess;': '\u226A',
    '&NewLine;': '\u000A',
    '&Nfr;': '\uD835\uDD11',
    '&NoBreak;': '\u2060',
    '&NonBreakingSpace;': '\u00A0',
    '&Nopf;': '\u2115',
    '&Not;': '\u2AEC',
    '&NotCongruent;': '\u2262',
    '&NotCupCap;': '\u226D',
    '&NotDoubleVerticalBar;': '\u2226',
    '&NotElement;': '\u2209',
    '&NotEqual;': '\u2260',
    '&NotEqualTilde;': '\u2242\u0338',
    '&NotExists;': '\u2204',
    '&NotGreater;': '\u226F',
    '&NotGreaterEqual;': '\u2271',
    '&NotGreaterFullEqual;': '\u2267\u0338',
    '&NotGreaterGreater;': '\u226B\u0338',
    '&NotGreaterLess;': '\u2279',
    '&NotGreaterSlantEqual;': '\u2A7E\u0338',
    '&NotGreaterTilde;': '\u2275',
    '&NotHumpDownHump;': '\u224E\u0338',
    '&NotHumpEqual;': '\u224F\u0338',
    '&NotLeftTriangle;': '\u22EA',
    '&NotLeftTriangleBar;': '\u29CF\u0338',
    '&NotLeftTriangleEqual;': '\u22EC',
    '&NotLess;': '\u226E',
    '&NotLessEqual;': '\u2270',
    '&NotLessGreater;': '\u2278',
    '&NotLessLess;': '\u226A\u0338',
    '&NotLessSlantEqual;': '\u2A7D\u0338',
    '&NotLessTilde;': '\u2274',
    '&NotNestedGreaterGreater;': '\u2AA2\u0338',
    '&NotNestedLessLess;': '\u2AA1\u0338',
    '&NotPrecedes;': '\u2280',
    '&NotPrecedesEqual;': '\u2AAF\u0338',
    '&NotPrecedesSlantEqual;': '\u22E0',
    '&NotReverseElement;': '\u220C',
    '&NotRightTriangle;': '\u22EB',
    '&NotRightTriangleBar;': '\u29D0\u0338',
    '&NotRightTriangleEqual;': '\u22ED',
    '&NotSquareSubset;': '\u228F\u0338',
    '&NotSquareSubsetEqual;': '\u22E2',
    '&NotSquareSuperset;': '\u2290\u0338',
    '&NotSquareSupersetEqual;': '\u22E3',
    '&NotSubset;': '\u2282\u20D2',
    '&NotSubsetEqual;': '\u2288',
    '&NotSucceeds;': '\u2281',
    '&NotSucceedsEqual;': '\u2AB0\u0338',
    '&NotSucceedsSlantEqual;': '\u22E1',
    '&NotSucceedsTilde;': '\u227F\u0338',
    '&NotSuperset;': '\u2283\u20D2',
    '&NotSupersetEqual;': '\u2289',
    '&NotTilde;': '\u2241',
    '&NotTildeEqual;': '\u2244',
    '&NotTildeFullEqual;': '\u2247',
    '&NotTildeTilde;': '\u2249',
    '&NotVerticalBar;': '\u2224',
    '&Nscr;': '\uD835\uDCA9',
    '&Ntilde': '\u00D1',
    '&Ntilde;': '\u00D1',
    '&Nu;': '\u039D',
    '&OElig;': '\u0152',
    '&Oacute': '\u00D3',
    '&Oacute;': '\u00D3',
    '&Ocirc': '\u00D4',
    '&Ocirc;': '\u00D4',
    '&Ocy;': '\u041E',
    '&Odblac;': '\u0150',
    '&Ofr;': '\uD835\uDD12',
    '&Ograve': '\u00D2',
    '&Ograve;': '\u00D2',
    '&Omacr;': '\u014C',
    '&Omega;': '\u03A9',
    '&Omicron;': '\u039F',
    '&Oopf;': '\uD835\uDD46',
    '&OpenCurlyDoubleQuote;': '\u201C',
    '&OpenCurlyQuote;': '\u2018',
    '&Or;': '\u2A54',
    '&Oscr;': '\uD835\uDCAA',
    '&Oslash': '\u00D8',
    '&Oslash;': '\u00D8',
    '&Otilde': '\u00D5',
    '&Otilde;': '\u00D5',
    '&Otimes;': '\u2A37',
    '&Ouml': '\u00D6',
    '&Ouml;': '\u00D6',
    '&OverBar;': '\u203E',
    '&OverBrace;': '\u23DE',
    '&OverBracket;': '\u23B4',
    '&OverParenthesis;': '\u23DC',
    '&PartialD;': '\u2202',
    '&Pcy;': '\u041F',
    '&Pfr;': '\uD835\uDD13',
    '&Phi;': '\u03A6',
    '&Pi;': '\u03A0',
    '&PlusMinus;': '\u00B1',
    '&Poincareplane;': '\u210C',
    '&Popf;': '\u2119',
    '&Pr;': '\u2ABB',
    '&Precedes;': '\u227A',
    '&PrecedesEqual;': '\u2AAF',
    '&PrecedesSlantEqual;': '\u227C',
    '&PrecedesTilde;': '\u227E',
    '&Prime;': '\u2033',
    '&Product;': '\u220F',
    '&Proportion;': '\u2237',
    '&Proportional;': '\u221D',
    '&Pscr;': '\uD835\uDCAB',
    '&Psi;': '\u03A8',
    '&QUOT': '\u0022',
    '&QUOT;': '\u0022',
    '&Qfr;': '\uD835\uDD14',
    '&Qopf;': '\u211A',
    '&Qscr;': '\uD835\uDCAC',
    '&RBarr;': '\u2910',
    '&REG': '\u00AE',
    '&REG;': '\u00AE',
    '&Racute;': '\u0154',
    '&Rang;': '\u27EB',
    '&Rarr;': '\u21A0',
    '&Rarrtl;': '\u2916',
    '&Rcaron;': '\u0158',
    '&Rcedil;': '\u0156',
    '&Rcy;': '\u0420',
    '&Re;': '\u211C',
    '&ReverseElement;': '\u220B',
    '&ReverseEquilibrium;': '\u21CB',
    '&ReverseUpEquilibrium;': '\u296F',
    '&Rfr;': '\u211C',
    '&Rho;': '\u03A1',
    '&RightAngleBracket;': '\u27E9',
    '&RightArrow;': '\u2192',
    '&RightArrowBar;': '\u21E5',
    '&RightArrowLeftArrow;': '\u21C4',
    '&RightCeiling;': '\u2309',
    '&RightDoubleBracket;': '\u27E7',
    '&RightDownTeeVector;': '\u295D',
    '&RightDownVector;': '\u21C2',
    '&RightDownVectorBar;': '\u2955',
    '&RightFloor;': '\u230B',
    '&RightTee;': '\u22A2',
    '&RightTeeArrow;': '\u21A6',
    '&RightTeeVector;': '\u295B',
    '&RightTriangle;': '\u22B3',
    '&RightTriangleBar;': '\u29D0',
    '&RightTriangleEqual;': '\u22B5',
    '&RightUpDownVector;': '\u294F',
    '&RightUpTeeVector;': '\u295C',
    '&RightUpVector;': '\u21BE',
    '&RightUpVectorBar;': '\u2954',
    '&RightVector;': '\u21C0',
    '&RightVectorBar;': '\u2953',
    '&Rightarrow;': '\u21D2',
    '&Ropf;': '\u211D',
    '&RoundImplies;': '\u2970',
    '&Rrightarrow;': '\u21DB',
    '&Rscr;': '\u211B',
    '&Rsh;': '\u21B1',
    '&RuleDelayed;': '\u29F4',
    '&SHCHcy;': '\u0429',
    '&SHcy;': '\u0428',
    '&SOFTcy;': '\u042C',
    '&Sacute;': '\u015A',
    '&Sc;': '\u2ABC',
    '&Scaron;': '\u0160',
    '&Scedil;': '\u015E',
    '&Scirc;': '\u015C',
    '&Scy;': '\u0421',
    '&Sfr;': '\uD835\uDD16',
    '&ShortDownArrow;': '\u2193',
    '&ShortLeftArrow;': '\u2190',
    '&ShortRightArrow;': '\u2192',
    '&ShortUpArrow;': '\u2191',
    '&Sigma;': '\u03A3',
    '&SmallCircle;': '\u2218',
    '&Sopf;': '\uD835\uDD4A',
    '&Sqrt;': '\u221A',
    '&Square;': '\u25A1',
    '&SquareIntersection;': '\u2293',
    '&SquareSubset;': '\u228F',
    '&SquareSubsetEqual;': '\u2291',
    '&SquareSuperset;': '\u2290',
    '&SquareSupersetEqual;': '\u2292',
    '&SquareUnion;': '\u2294',
    '&Sscr;': '\uD835\uDCAE',
    '&Star;': '\u22C6',
    '&Sub;': '\u22D0',
    '&Subset;': '\u22D0',
    '&SubsetEqual;': '\u2286',
    '&Succeeds;': '\u227B',
    '&SucceedsEqual;': '\u2AB0',
    '&SucceedsSlantEqual;': '\u227D',
    '&SucceedsTilde;': '\u227F',
    '&SuchThat;': '\u220B',
    '&Sum;': '\u2211',
    '&Sup;': '\u22D1',
    '&Superset;': '\u2283',
    '&SupersetEqual;': '\u2287',
    '&Supset;': '\u22D1',
    '&THORN': '\u00DE',
    '&THORN;': '\u00DE',
    '&TRADE;': '\u2122',
    '&TSHcy;': '\u040B',
    '&TScy;': '\u0426',
    '&Tab;': '\u0009',
    '&Tau;': '\u03A4',
    '&Tcaron;': '\u0164',
    '&Tcedil;': '\u0162',
    '&Tcy;': '\u0422',
    '&Tfr;': '\uD835\uDD17',
    '&Therefore;': '\u2234',
    '&Theta;': '\u0398',
    '&ThickSpace;': '\u205F\u200A',
    '&ThinSpace;': '\u2009',
    '&Tilde;': '\u223C',
    '&TildeEqual;': '\u2243',
    '&TildeFullEqual;': '\u2245',
    '&TildeTilde;': '\u2248',
    '&Topf;': '\uD835\uDD4B',
    '&TripleDot;': '\u20DB',
    '&Tscr;': '\uD835\uDCAF',
    '&Tstrok;': '\u0166',
    '&Uacute': '\u00DA',
    '&Uacute;': '\u00DA',
    '&Uarr;': '\u219F',
    '&Uarrocir;': '\u2949',
    '&Ubrcy;': '\u040E',
    '&Ubreve;': '\u016C',
    '&Ucirc': '\u00DB',
    '&Ucirc;': '\u00DB',
    '&Ucy;': '\u0423',
    '&Udblac;': '\u0170',
    '&Ufr;': '\uD835\uDD18',
    '&Ugrave': '\u00D9',
    '&Ugrave;': '\u00D9',
    '&Umacr;': '\u016A',
    '&UnderBar;': '\u005F',
    '&UnderBrace;': '\u23DF',
    '&UnderBracket;': '\u23B5',
    '&UnderParenthesis;': '\u23DD',
    '&Union;': '\u22C3',
    '&UnionPlus;': '\u228E',
    '&Uogon;': '\u0172',
    '&Uopf;': '\uD835\uDD4C',
    '&UpArrow;': '\u2191',
    '&UpArrowBar;': '\u2912',
    '&UpArrowDownArrow;': '\u21C5',
    '&UpDownArrow;': '\u2195',
    '&UpEquilibrium;': '\u296E',
    '&UpTee;': '\u22A5',
    '&UpTeeArrow;': '\u21A5',
    '&Uparrow;': '\u21D1',
    '&Updownarrow;': '\u21D5',
    '&UpperLeftArrow;': '\u2196',
    '&UpperRightArrow;': '\u2197',
    '&Upsi;': '\u03D2',
    '&Upsilon;': '\u03A5',
    '&Uring;': '\u016E',
    '&Uscr;': '\uD835\uDCB0',
    '&Utilde;': '\u0168',
    '&Uuml': '\u00DC',
    '&Uuml;': '\u00DC',
    '&VDash;': '\u22AB',
    '&Vbar;': '\u2AEB',
    '&Vcy;': '\u0412',
    '&Vdash;': '\u22A9',
    '&Vdashl;': '\u2AE6',
    '&Vee;': '\u22C1',
    '&Verbar;': '\u2016',
    '&Vert;': '\u2016',
    '&VerticalBar;': '\u2223',
    '&VerticalLine;': '\u007C',
    '&VerticalSeparator;': '\u2758',
    '&VerticalTilde;': '\u2240',
    '&VeryThinSpace;': '\u200A',
    '&Vfr;': '\uD835\uDD19',
    '&Vopf;': '\uD835\uDD4D',
    '&Vscr;': '\uD835\uDCB1',
    '&Vvdash;': '\u22AA',
    '&Wcirc;': '\u0174',
    '&Wedge;': '\u22C0',
    '&Wfr;': '\uD835\uDD1A',
    '&Wopf;': '\uD835\uDD4E',
    '&Wscr;': '\uD835\uDCB2',
    '&Xfr;': '\uD835\uDD1B',
    '&Xi;': '\u039E',
    '&Xopf;': '\uD835\uDD4F',
    '&Xscr;': '\uD835\uDCB3',
    '&YAcy;': '\u042F',
    '&YIcy;': '\u0407',
    '&YUcy;': '\u042E',
    '&Yacute': '\u00DD',
    '&Yacute;': '\u00DD',
    '&Ycirc;': '\u0176',
    '&Ycy;': '\u042B',
    '&Yfr;': '\uD835\uDD1C',
    '&Yopf;': '\uD835\uDD50',
    '&Yscr;': '\uD835\uDCB4',
    '&Yuml;': '\u0178',
    '&ZHcy;': '\u0416',
    '&Zacute;': '\u0179',
    '&Zcaron;': '\u017D',
    '&Zcy;': '\u0417',
    '&Zdot;': '\u017B',
    '&ZeroWidthSpace;': '\u200B',
    '&Zeta;': '\u0396',
    '&Zfr;': '\u2128',
    '&Zopf;': '\u2124',
    '&Zscr;': '\uD835\uDCB5',
    '&aacute': '\u00E1',
    '&aacute;': '\u00E1',
    '&abreve;': '\u0103',
    '&ac;': '\u223E',
    '&acE;': '\u223E\u0333',
    '&acd;': '\u223F',
    '&acirc': '\u00E2',
    '&acirc;': '\u00E2',
    '&acute': '\u00B4',
    '&acute;': '\u00B4',
    '&acy;': '\u0430',
    '&aelig': '\u00E6',
    '&aelig;': '\u00E6',
    '&af;': '\u2061',
    '&afr;': '\uD835\uDD1E',
    '&agrave': '\u00E0',
    '&agrave;': '\u00E0',
    '&alefsym;': '\u2135',
    '&aleph;': '\u2135',
    '&alpha;': '\u03B1',
    '&amacr;': '\u0101',
    '&amalg;': '\u2A3F',
    '&amp': '\u0026',
    '&amp;': '\u0026',
    '&and;': '\u2227',
    '&andand;': '\u2A55',
    '&andd;': '\u2A5C',
    '&andslope;': '\u2A58',
    '&andv;': '\u2A5A',
    '&ang;': '\u2220',
    '&ange;': '\u29A4',
    '&angle;': '\u2220',
    '&angmsd;': '\u2221',
    '&angmsdaa;': '\u29A8',
    '&angmsdab;': '\u29A9',
    '&angmsdac;': '\u29AA',
    '&angmsdad;': '\u29AB',
    '&angmsdae;': '\u29AC',
    '&angmsdaf;': '\u29AD',
    '&angmsdag;': '\u29AE',
    '&angmsdah;': '\u29AF',
    '&angrt;': '\u221F',
    '&angrtvb;': '\u22BE',
    '&angrtvbd;': '\u299D',
    '&angsph;': '\u2222',
    '&angst;': '\u00C5',
    '&angzarr;': '\u237C',
    '&aogon;': '\u0105',
    '&aopf;': '\uD835\uDD52',
    '&ap;': '\u2248',
    '&apE;': '\u2A70',
    '&apacir;': '\u2A6F',
    '&ape;': '\u224A',
    '&apid;': '\u224B',
    '&apos;': '\u0027',
    '&approx;': '\u2248',
    '&approxeq;': '\u224A',
    '&aring': '\u00E5',
    '&aring;': '\u00E5',
    '&ascr;': '\uD835\uDCB6',
    '&ast;': '\u002A',
    '&asymp;': '\u2248',
    '&asympeq;': '\u224D',
    '&atilde': '\u00E3',
    '&atilde;': '\u00E3',
    '&auml': '\u00E4',
    '&auml;': '\u00E4',
    '&awconint;': '\u2233',
    '&awint;': '\u2A11',
    '&bNot;': '\u2AED',
    '&backcong;': '\u224C',
    '&backepsilon;': '\u03F6',
    '&backprime;': '\u2035',
    '&backsim;': '\u223D',
    '&backsimeq;': '\u22CD',
    '&barvee;': '\u22BD',
    '&barwed;': '\u2305',
    '&barwedge;': '\u2305',
    '&bbrk;': '\u23B5',
    '&bbrktbrk;': '\u23B6',
    '&bcong;': '\u224C',
    '&bcy;': '\u0431',
    '&bdquo;': '\u201E',
    '&becaus;': '\u2235',
    '&because;': '\u2235',
    '&bemptyv;': '\u29B0',
    '&bepsi;': '\u03F6',
    '&bernou;': '\u212C',
    '&beta;': '\u03B2',
    '&beth;': '\u2136',
    '&between;': '\u226C',
    '&bfr;': '\uD835\uDD1F',
    '&bigcap;': '\u22C2',
    '&bigcirc;': '\u25EF',
    '&bigcup;': '\u22C3',
    '&bigodot;': '\u2A00',
    '&bigoplus;': '\u2A01',
    '&bigotimes;': '\u2A02',
    '&bigsqcup;': '\u2A06',
    '&bigstar;': '\u2605',
    '&bigtriangledown;': '\u25BD',
    '&bigtriangleup;': '\u25B3',
    '&biguplus;': '\u2A04',
    '&bigvee;': '\u22C1',
    '&bigwedge;': '\u22C0',
    '&bkarow;': '\u290D',
    '&blacklozenge;': '\u29EB',
    '&blacksquare;': '\u25AA',
    '&blacktriangle;': '\u25B4',
    '&blacktriangledown;': '\u25BE',
    '&blacktriangleleft;': '\u25C2',
    '&blacktriangleright;': '\u25B8',
    '&blank;': '\u2423',
    '&blk12;': '\u2592',
    '&blk14;': '\u2591',
    '&blk34;': '\u2593',
    '&block;': '\u2588',
    '&bne;': '\u003D\u20E5',
    '&bnequiv;': '\u2261\u20E5',
    '&bnot;': '\u2310',
    '&bopf;': '\uD835\uDD53',
    '&bot;': '\u22A5',
    '&bottom;': '\u22A5',
    '&bowtie;': '\u22C8',
    '&boxDL;': '\u2557',
    '&boxDR;': '\u2554',
    '&boxDl;': '\u2556',
    '&boxDr;': '\u2553',
    '&boxH;': '\u2550',
    '&boxHD;': '\u2566',
    '&boxHU;': '\u2569',
    '&boxHd;': '\u2564',
    '&boxHu;': '\u2567',
    '&boxUL;': '\u255D',
    '&boxUR;': '\u255A',
    '&boxUl;': '\u255C',
    '&boxUr;': '\u2559',
    '&boxV;': '\u2551',
    '&boxVH;': '\u256C',
    '&boxVL;': '\u2563',
    '&boxVR;': '\u2560',
    '&boxVh;': '\u256B',
    '&boxVl;': '\u2562',
    '&boxVr;': '\u255F',
    '&boxbox;': '\u29C9',
    '&boxdL;': '\u2555',
    '&boxdR;': '\u2552',
    '&boxdl;': '\u2510',
    '&boxdr;': '\u250C',
    '&boxh;': '\u2500',
    '&boxhD;': '\u2565',
    '&boxhU;': '\u2568',
    '&boxhd;': '\u252C',
    '&boxhu;': '\u2534',
    '&boxminus;': '\u229F',
    '&boxplus;': '\u229E',
    '&boxtimes;': '\u22A0',
    '&boxuL;': '\u255B',
    '&boxuR;': '\u2558',
    '&boxul;': '\u2518',
    '&boxur;': '\u2514',
    '&boxv;': '\u2502',
    '&boxvH;': '\u256A',
    '&boxvL;': '\u2561',
    '&boxvR;': '\u255E',
    '&boxvh;': '\u253C',
    '&boxvl;': '\u2524',
    '&boxvr;': '\u251C',
    '&bprime;': '\u2035',
    '&breve;': '\u02D8',
    '&brvbar': '\u00A6',
    '&brvbar;': '\u00A6',
    '&bscr;': '\uD835\uDCB7',
    '&bsemi;': '\u204F',
    '&bsim;': '\u223D',
    '&bsime;': '\u22CD',
    '&bsol;': '\u005C',
    '&bsolb;': '\u29C5',
    '&bsolhsub;': '\u27C8',
    '&bull;': '\u2022',
    '&bullet;': '\u2022',
    '&bump;': '\u224E',
    '&bumpE;': '\u2AAE',
    '&bumpe;': '\u224F',
    '&bumpeq;': '\u224F',
    '&cacute;': '\u0107',
    '&cap;': '\u2229',
    '&capand;': '\u2A44',
    '&capbrcup;': '\u2A49',
    '&capcap;': '\u2A4B',
    '&capcup;': '\u2A47',
    '&capdot;': '\u2A40',
    '&caps;': '\u2229\uFE00',
    '&caret;': '\u2041',
    '&caron;': '\u02C7',
    '&ccaps;': '\u2A4D',
    '&ccaron;': '\u010D',
    '&ccedil': '\u00E7',
    '&ccedil;': '\u00E7',
    '&ccirc;': '\u0109',
    '&ccups;': '\u2A4C',
    '&ccupssm;': '\u2A50',
    '&cdot;': '\u010B',
    '&cedil': '\u00B8',
    '&cedil;': '\u00B8',
    '&cemptyv;': '\u29B2',
    '&cent': '\u00A2',
    '&cent;': '\u00A2',
    '&centerdot;': '\u00B7',
    '&cfr;': '\uD835\uDD20',
    '&chcy;': '\u0447',
    '&check;': '\u2713',
    '&checkmark;': '\u2713',
    '&chi;': '\u03C7',
    '&cir;': '\u25CB',
    '&cirE;': '\u29C3',
    '&circ;': '\u02C6',
    '&circeq;': '\u2257',
    '&circlearrowleft;': '\u21BA',
    '&circlearrowright;': '\u21BB',
    '&circledR;': '\u00AE',
    '&circledS;': '\u24C8',
    '&circledast;': '\u229B',
    '&circledcirc;': '\u229A',
    '&circleddash;': '\u229D',
    '&cire;': '\u2257',
    '&cirfnint;': '\u2A10',
    '&cirmid;': '\u2AEF',
    '&cirscir;': '\u29C2',
    '&clubs;': '\u2663',
    '&clubsuit;': '\u2663',
    '&colon;': '\u003A',
    '&colone;': '\u2254',
    '&coloneq;': '\u2254',
    '&comma;': '\u002C',
    '&commat;': '\u0040',
    '&comp;': '\u2201',
    '&compfn;': '\u2218',
    '&complement;': '\u2201',
    '&complexes;': '\u2102',
    '&cong;': '\u2245',
    '&congdot;': '\u2A6D',
    '&conint;': '\u222E',
    '&copf;': '\uD835\uDD54',
    '&coprod;': '\u2210',
    '&copy': '\u00A9',
    '&copy;': '\u00A9',
    '&copysr;': '\u2117',
    '&crarr;': '\u21B5',
    '&cross;': '\u2717',
    '&cscr;': '\uD835\uDCB8',
    '&csub;': '\u2ACF',
    '&csube;': '\u2AD1',
    '&csup;': '\u2AD0',
    '&csupe;': '\u2AD2',
    '&ctdot;': '\u22EF',
    '&cudarrl;': '\u2938',
    '&cudarrr;': '\u2935',
    '&cuepr;': '\u22DE',
    '&cuesc;': '\u22DF',
    '&cularr;': '\u21B6',
    '&cularrp;': '\u293D',
    '&cup;': '\u222A',
    '&cupbrcap;': '\u2A48',
    '&cupcap;': '\u2A46',
    '&cupcup;': '\u2A4A',
    '&cupdot;': '\u228D',
    '&cupor;': '\u2A45',
    '&cups;': '\u222A\uFE00',
    '&curarr;': '\u21B7',
    '&curarrm;': '\u293C',
    '&curlyeqprec;': '\u22DE',
    '&curlyeqsucc;': '\u22DF',
    '&curlyvee;': '\u22CE',
    '&curlywedge;': '\u22CF',
    '&curren': '\u00A4',
    '&curren;': '\u00A4',
    '&curvearrowleft;': '\u21B6',
    '&curvearrowright;': '\u21B7',
    '&cuvee;': '\u22CE',
    '&cuwed;': '\u22CF',
    '&cwconint;': '\u2232',
    '&cwint;': '\u2231',
    '&cylcty;': '\u232D',
    '&dArr;': '\u21D3',
    '&dHar;': '\u2965',
    '&dagger;': '\u2020',
    '&daleth;': '\u2138',
    '&darr;': '\u2193',
    '&dash;': '\u2010',
    '&dashv;': '\u22A3',
    '&dbkarow;': '\u290F',
    '&dblac;': '\u02DD',
    '&dcaron;': '\u010F',
    '&dcy;': '\u0434',
    '&dd;': '\u2146',
    '&ddagger;': '\u2021',
    '&ddarr;': '\u21CA',
    '&ddotseq;': '\u2A77',
    '&deg': '\u00B0',
    '&deg;': '\u00B0',
    '&delta;': '\u03B4',
    '&demptyv;': '\u29B1',
    '&dfisht;': '\u297F',
    '&dfr;': '\uD835\uDD21',
    '&dharl;': '\u21C3',
    '&dharr;': '\u21C2',
    '&diam;': '\u22C4',
    '&diamond;': '\u22C4',
    '&diamondsuit;': '\u2666',
    '&diams;': '\u2666',
    '&die;': '\u00A8',
    '&digamma;': '\u03DD',
    '&disin;': '\u22F2',
    '&div;': '\u00F7',
    '&divide': '\u00F7',
    '&divide;': '\u00F7',
    '&divideontimes;': '\u22C7',
    '&divonx;': '\u22C7',
    '&djcy;': '\u0452',
    '&dlcorn;': '\u231E',
    '&dlcrop;': '\u230D',
    '&dollar;': '\u0024',
    '&dopf;': '\uD835\uDD55',
    '&dot;': '\u02D9',
    '&doteq;': '\u2250',
    '&doteqdot;': '\u2251',
    '&dotminus;': '\u2238',
    '&dotplus;': '\u2214',
    '&dotsquare;': '\u22A1',
    '&doublebarwedge;': '\u2306',
    '&downarrow;': '\u2193',
    '&downdownarrows;': '\u21CA',
    '&downharpoonleft;': '\u21C3',
    '&downharpoonright;': '\u21C2',
    '&drbkarow;': '\u2910',
    '&drcorn;': '\u231F',
    '&drcrop;': '\u230C',
    '&dscr;': '\uD835\uDCB9',
    '&dscy;': '\u0455',
    '&dsol;': '\u29F6',
    '&dstrok;': '\u0111',
    '&dtdot;': '\u22F1',
    '&dtri;': '\u25BF',
    '&dtrif;': '\u25BE',
    '&duarr;': '\u21F5',
    '&duhar;': '\u296F',
    '&dwangle;': '\u29A6',
    '&dzcy;': '\u045F',
    '&dzigrarr;': '\u27FF',
    '&eDDot;': '\u2A77',
    '&eDot;': '\u2251',
    '&eacute': '\u00E9',
    '&eacute;': '\u00E9',
    '&easter;': '\u2A6E',
    '&ecaron;': '\u011B',
    '&ecir;': '\u2256',
    '&ecirc': '\u00EA',
    '&ecirc;': '\u00EA',
    '&ecolon;': '\u2255',
    '&ecy;': '\u044D',
    '&edot;': '\u0117',
    '&ee;': '\u2147',
    '&efDot;': '\u2252',
    '&efr;': '\uD835\uDD22',
    '&eg;': '\u2A9A',
    '&egrave': '\u00E8',
    '&egrave;': '\u00E8',
    '&egs;': '\u2A96',
    '&egsdot;': '\u2A98',
    '&el;': '\u2A99',
    '&elinters;': '\u23E7',
    '&ell;': '\u2113',
    '&els;': '\u2A95',
    '&elsdot;': '\u2A97',
    '&emacr;': '\u0113',
    '&empty;': '\u2205',
    '&emptyset;': '\u2205',
    '&emptyv;': '\u2205',
    '&emsp13;': '\u2004',
    '&emsp14;': '\u2005',
    '&emsp;': '\u2003',
    '&eng;': '\u014B',
    '&ensp;': '\u2002',
    '&eogon;': '\u0119',
    '&eopf;': '\uD835\uDD56',
    '&epar;': '\u22D5',
    '&eparsl;': '\u29E3',
    '&eplus;': '\u2A71',
    '&epsi;': '\u03B5',
    '&epsilon;': '\u03B5',
    '&epsiv;': '\u03F5',
    '&eqcirc;': '\u2256',
    '&eqcolon;': '\u2255',
    '&eqsim;': '\u2242',
    '&eqslantgtr;': '\u2A96',
    '&eqslantless;': '\u2A95',
    '&equals;': '\u003D',
    '&equest;': '\u225F',
    '&equiv;': '\u2261',
    '&equivDD;': '\u2A78',
    '&eqvparsl;': '\u29E5',
    '&erDot;': '\u2253',
    '&erarr;': '\u2971',
    '&escr;': '\u212F',
    '&esdot;': '\u2250',
    '&esim;': '\u2242',
    '&eta;': '\u03B7',
    '&eth': '\u00F0',
    '&eth;': '\u00F0',
    '&euml': '\u00EB',
    '&euml;': '\u00EB',
    '&euro;': '\u20AC',
    '&excl;': '\u0021',
    '&exist;': '\u2203',
    '&expectation;': '\u2130',
    '&exponentiale;': '\u2147',
    '&fallingdotseq;': '\u2252',
    '&fcy;': '\u0444',
    '&female;': '\u2640',
    '&ffilig;': '\uFB03',
    '&fflig;': '\uFB00',
    '&ffllig;': '\uFB04',
    '&ffr;': '\uD835\uDD23',
    '&filig;': '\uFB01',
    '&fjlig;': '\u0066\u006A',
    '&flat;': '\u266D',
    '&fllig;': '\uFB02',
    '&fltns;': '\u25B1',
    '&fnof;': '\u0192',
    '&fopf;': '\uD835\uDD57',
    '&forall;': '\u2200',
    '&fork;': '\u22D4',
    '&forkv;': '\u2AD9',
    '&fpartint;': '\u2A0D',
    '&frac12': '\u00BD',
    '&frac12;': '\u00BD',
    '&frac13;': '\u2153',
    '&frac14': '\u00BC',
    '&frac14;': '\u00BC',
    '&frac15;': '\u2155',
    '&frac16;': '\u2159',
    '&frac18;': '\u215B',
    '&frac23;': '\u2154',
    '&frac25;': '\u2156',
    '&frac34': '\u00BE',
    '&frac34;': '\u00BE',
    '&frac35;': '\u2157',
    '&frac38;': '\u215C',
    '&frac45;': '\u2158',
    '&frac56;': '\u215A',
    '&frac58;': '\u215D',
    '&frac78;': '\u215E',
    '&frasl;': '\u2044',
    '&frown;': '\u2322',
    '&fscr;': '\uD835\uDCBB',
    '&gE;': '\u2267',
    '&gEl;': '\u2A8C',
    '&gacute;': '\u01F5',
    '&gamma;': '\u03B3',
    '&gammad;': '\u03DD',
    '&gap;': '\u2A86',
    '&gbreve;': '\u011F',
    '&gcirc;': '\u011D',
    '&gcy;': '\u0433',
    '&gdot;': '\u0121',
    '&ge;': '\u2265',
    '&gel;': '\u22DB',
    '&geq;': '\u2265',
    '&geqq;': '\u2267',
    '&geqslant;': '\u2A7E',
    '&ges;': '\u2A7E',
    '&gescc;': '\u2AA9',
    '&gesdot;': '\u2A80',
    '&gesdoto;': '\u2A82',
    '&gesdotol;': '\u2A84',
    '&gesl;': '\u22DB\uFE00',
    '&gesles;': '\u2A94',
    '&gfr;': '\uD835\uDD24',
    '&gg;': '\u226B',
    '&ggg;': '\u22D9',
    '&gimel;': '\u2137',
    '&gjcy;': '\u0453',
    '&gl;': '\u2277',
    '&glE;': '\u2A92',
    '&gla;': '\u2AA5',
    '&glj;': '\u2AA4',
    '&gnE;': '\u2269',
    '&gnap;': '\u2A8A',
    '&gnapprox;': '\u2A8A',
    '&gne;': '\u2A88',
    '&gneq;': '\u2A88',
    '&gneqq;': '\u2269',
    '&gnsim;': '\u22E7',
    '&gopf;': '\uD835\uDD58',
    '&grave;': '\u0060',
    '&gscr;': '\u210A',
    '&gsim;': '\u2273',
    '&gsime;': '\u2A8E',
    '&gsiml;': '\u2A90',
    '&gt': '\u003E',
    '&gt;': '\u003E',
    '&gtcc;': '\u2AA7',
    '&gtcir;': '\u2A7A',
    '&gtdot;': '\u22D7',
    '&gtlPar;': '\u2995',
    '&gtquest;': '\u2A7C',
    '&gtrapprox;': '\u2A86',
    '&gtrarr;': '\u2978',
    '&gtrdot;': '\u22D7',
    '&gtreqless;': '\u22DB',
    '&gtreqqless;': '\u2A8C',
    '&gtrless;': '\u2277',
    '&gtrsim;': '\u2273',
    '&gvertneqq;': '\u2269\uFE00',
    '&gvnE;': '\u2269\uFE00',
    '&hArr;': '\u21D4',
    '&hairsp;': '\u200A',
    '&half;': '\u00BD',
    '&hamilt;': '\u210B',
    '&hardcy;': '\u044A',
    '&harr;': '\u2194',
    '&harrcir;': '\u2948',
    '&harrw;': '\u21AD',
    '&hbar;': '\u210F',
    '&hcirc;': '\u0125',
    '&hearts;': '\u2665',
    '&heartsuit;': '\u2665',
    '&hellip;': '\u2026',
    '&hercon;': '\u22B9',
    '&hfr;': '\uD835\uDD25',
    '&hksearow;': '\u2925',
    '&hkswarow;': '\u2926',
    '&hoarr;': '\u21FF',
    '&homtht;': '\u223B',
    '&hookleftarrow;': '\u21A9',
    '&hookrightarrow;': '\u21AA',
    '&hopf;': '\uD835\uDD59',
    '&horbar;': '\u2015',
    '&hscr;': '\uD835\uDCBD',
    '&hslash;': '\u210F',
    '&hstrok;': '\u0127',
    '&hybull;': '\u2043',
    '&hyphen;': '\u2010',
    '&iacute': '\u00ED',
    '&iacute;': '\u00ED',
    '&ic;': '\u2063',
    '&icirc': '\u00EE',
    '&icirc;': '\u00EE',
    '&icy;': '\u0438',
    '&iecy;': '\u0435',
    '&iexcl': '\u00A1',
    '&iexcl;': '\u00A1',
    '&iff;': '\u21D4',
    '&ifr;': '\uD835\uDD26',
    '&igrave': '\u00EC',
    '&igrave;': '\u00EC',
    '&ii;': '\u2148',
    '&iiiint;': '\u2A0C',
    '&iiint;': '\u222D',
    '&iinfin;': '\u29DC',
    '&iiota;': '\u2129',
    '&ijlig;': '\u0133',
    '&imacr;': '\u012B',
    '&image;': '\u2111',
    '&imagline;': '\u2110',
    '&imagpart;': '\u2111',
    '&imath;': '\u0131',
    '&imof;': '\u22B7',
    '&imped;': '\u01B5',
    '&in;': '\u2208',
    '&incare;': '\u2105',
    '&infin;': '\u221E',
    '&infintie;': '\u29DD',
    '&inodot;': '\u0131',
    '&int;': '\u222B',
    '&intcal;': '\u22BA',
    '&integers;': '\u2124',
    '&intercal;': '\u22BA',
    '&intlarhk;': '\u2A17',
    '&intprod;': '\u2A3C',
    '&iocy;': '\u0451',
    '&iogon;': '\u012F',
    '&iopf;': '\uD835\uDD5A',
    '&iota;': '\u03B9',
    '&iprod;': '\u2A3C',
    '&iquest': '\u00BF',
    '&iquest;': '\u00BF',
    '&iscr;': '\uD835\uDCBE',
    '&isin;': '\u2208',
    '&isinE;': '\u22F9',
    '&isindot;': '\u22F5',
    '&isins;': '\u22F4',
    '&isinsv;': '\u22F3',
    '&isinv;': '\u2208',
    '&it;': '\u2062',
    '&itilde;': '\u0129',
    '&iukcy;': '\u0456',
    '&iuml': '\u00EF',
    '&iuml;': '\u00EF',
    '&jcirc;': '\u0135',
    '&jcy;': '\u0439',
    '&jfr;': '\uD835\uDD27',
    '&jmath;': '\u0237',
    '&jopf;': '\uD835\uDD5B',
    '&jscr;': '\uD835\uDCBF',
    '&jsercy;': '\u0458',
    '&jukcy;': '\u0454',
    '&kappa;': '\u03BA',
    '&kappav;': '\u03F0',
    '&kcedil;': '\u0137',
    '&kcy;': '\u043A',
    '&kfr;': '\uD835\uDD28',
    '&kgreen;': '\u0138',
    '&khcy;': '\u0445',
    '&kjcy;': '\u045C',
    '&kopf;': '\uD835\uDD5C',
    '&kscr;': '\uD835\uDCC0',
    '&lAarr;': '\u21DA',
    '&lArr;': '\u21D0',
    '&lAtail;': '\u291B',
    '&lBarr;': '\u290E',
    '&lE;': '\u2266',
    '&lEg;': '\u2A8B',
    '&lHar;': '\u2962',
    '&lacute;': '\u013A',
    '&laemptyv;': '\u29B4',
    '&lagran;': '\u2112',
    '&lambda;': '\u03BB',
    '&lang;': '\u27E8',
    '&langd;': '\u2991',
    '&langle;': '\u27E8',
    '&lap;': '\u2A85',
    '&laquo': '\u00AB',
    '&laquo;': '\u00AB',
    '&larr;': '\u2190',
    '&larrb;': '\u21E4',
    '&larrbfs;': '\u291F',
    '&larrfs;': '\u291D',
    '&larrhk;': '\u21A9',
    '&larrlp;': '\u21AB',
    '&larrpl;': '\u2939',
    '&larrsim;': '\u2973',
    '&larrtl;': '\u21A2',
    '&lat;': '\u2AAB',
    '&latail;': '\u2919',
    '&late;': '\u2AAD',
    '&lates;': '\u2AAD\uFE00',
    '&lbarr;': '\u290C',
    '&lbbrk;': '\u2772',
    '&lbrace;': '\u007B',
    '&lbrack;': '\u005B',
    '&lbrke;': '\u298B',
    '&lbrksld;': '\u298F',
    '&lbrkslu;': '\u298D',
    '&lcaron;': '\u013E',
    '&lcedil;': '\u013C',
    '&lceil;': '\u2308',
    '&lcub;': '\u007B',
    '&lcy;': '\u043B',
    '&ldca;': '\u2936',
    '&ldquo;': '\u201C',
    '&ldquor;': '\u201E',
    '&ldrdhar;': '\u2967',
    '&ldrushar;': '\u294B',
    '&ldsh;': '\u21B2',
    '&le;': '\u2264',
    '&leftarrow;': '\u2190',
    '&leftarrowtail;': '\u21A2',
    '&leftharpoondown;': '\u21BD',
    '&leftharpoonup;': '\u21BC',
    '&leftleftarrows;': '\u21C7',
    '&leftrightarrow;': '\u2194',
    '&leftrightarrows;': '\u21C6',
    '&leftrightharpoons;': '\u21CB',
    '&leftrightsquigarrow;': '\u21AD',
    '&leftthreetimes;': '\u22CB',
    '&leg;': '\u22DA',
    '&leq;': '\u2264',
    '&leqq;': '\u2266',
    '&leqslant;': '\u2A7D',
    '&les;': '\u2A7D',
    '&lescc;': '\u2AA8',
    '&lesdot;': '\u2A7F',
    '&lesdoto;': '\u2A81',
    '&lesdotor;': '\u2A83',
    '&lesg;': '\u22DA\uFE00',
    '&lesges;': '\u2A93',
    '&lessapprox;': '\u2A85',
    '&lessdot;': '\u22D6',
    '&lesseqgtr;': '\u22DA',
    '&lesseqqgtr;': '\u2A8B',
    '&lessgtr;': '\u2276',
    '&lesssim;': '\u2272',
    '&lfisht;': '\u297C',
    '&lfloor;': '\u230A',
    '&lfr;': '\uD835\uDD29',
    '&lg;': '\u2276',
    '&lgE;': '\u2A91',
    '&lhard;': '\u21BD',
    '&lharu;': '\u21BC',
    '&lharul;': '\u296A',
    '&lhblk;': '\u2584',
    '&ljcy;': '\u0459',
    '&ll;': '\u226A',
    '&llarr;': '\u21C7',
    '&llcorner;': '\u231E',
    '&llhard;': '\u296B',
    '&lltri;': '\u25FA',
    '&lmidot;': '\u0140',
    '&lmoust;': '\u23B0',
    '&lmoustache;': '\u23B0',
    '&lnE;': '\u2268',
    '&lnap;': '\u2A89',
    '&lnapprox;': '\u2A89',
    '&lne;': '\u2A87',
    '&lneq;': '\u2A87',
    '&lneqq;': '\u2268',
    '&lnsim;': '\u22E6',
    '&loang;': '\u27EC',
    '&loarr;': '\u21FD',
    '&lobrk;': '\u27E6',
    '&longleftarrow;': '\u27F5',
    '&longleftrightarrow;': '\u27F7',
    '&longmapsto;': '\u27FC',
    '&longrightarrow;': '\u27F6',
    '&looparrowleft;': '\u21AB',
    '&looparrowright;': '\u21AC',
    '&lopar;': '\u2985',
    '&lopf;': '\uD835\uDD5D',
    '&loplus;': '\u2A2D',
    '&lotimes;': '\u2A34',
    '&lowast;': '\u2217',
    '&lowbar;': '\u005F',
    '&loz;': '\u25CA',
    '&lozenge;': '\u25CA',
    '&lozf;': '\u29EB',
    '&lpar;': '\u0028',
    '&lparlt;': '\u2993',
    '&lrarr;': '\u21C6',
    '&lrcorner;': '\u231F',
    '&lrhar;': '\u21CB',
    '&lrhard;': '\u296D',
    '&lrm;': '\u200E',
    '&lrtri;': '\u22BF',
    '&lsaquo;': '\u2039',
    '&lscr;': '\uD835\uDCC1',
    '&lsh;': '\u21B0',
    '&lsim;': '\u2272',
    '&lsime;': '\u2A8D',
    '&lsimg;': '\u2A8F',
    '&lsqb;': '\u005B',
    '&lsquo;': '\u2018',
    '&lsquor;': '\u201A',
    '&lstrok;': '\u0142',
    '&lt': '\u003C',
    '&lt;': '\u003C',
    '&ltcc;': '\u2AA6',
    '&ltcir;': '\u2A79',
    '&ltdot;': '\u22D6',
    '&lthree;': '\u22CB',
    '&ltimes;': '\u22C9',
    '&ltlarr;': '\u2976',
    '&ltquest;': '\u2A7B',
    '&ltrPar;': '\u2996',
    '&ltri;': '\u25C3',
    '&ltrie;': '\u22B4',
    '&ltrif;': '\u25C2',
    '&lurdshar;': '\u294A',
    '&luruhar;': '\u2966',
    '&lvertneqq;': '\u2268\uFE00',
    '&lvnE;': '\u2268\uFE00',
    '&mDDot;': '\u223A',
    '&macr': '\u00AF',
    '&macr;': '\u00AF',
    '&male;': '\u2642',
    '&malt;': '\u2720',
    '&maltese;': '\u2720',
    '&map;': '\u21A6',
    '&mapsto;': '\u21A6',
    '&mapstodown;': '\u21A7',
    '&mapstoleft;': '\u21A4',
    '&mapstoup;': '\u21A5',
    '&marker;': '\u25AE',
    '&mcomma;': '\u2A29',
    '&mcy;': '\u043C',
    '&mdash;': '\u2014',
    '&measuredangle;': '\u2221',
    '&mfr;': '\uD835\uDD2A',
    '&mho;': '\u2127',
    '&micro': '\u00B5',
    '&micro;': '\u00B5',
    '&mid;': '\u2223',
    '&midast;': '\u002A',
    '&midcir;': '\u2AF0',
    '&middot': '\u00B7',
    '&middot;': '\u00B7',
    '&minus;': '\u2212',
    '&minusb;': '\u229F',
    '&minusd;': '\u2238',
    '&minusdu;': '\u2A2A',
    '&mlcp;': '\u2ADB',
    '&mldr;': '\u2026',
    '&mnplus;': '\u2213',
    '&models;': '\u22A7',
    '&mopf;': '\uD835\uDD5E',
    '&mp;': '\u2213',
    '&mscr;': '\uD835\uDCC2',
    '&mstpos;': '\u223E',
    '&mu;': '\u03BC',
    '&multimap;': '\u22B8',
    '&mumap;': '\u22B8',
    '&nGg;': '\u22D9\u0338',
    '&nGt;': '\u226B\u20D2',
    '&nGtv;': '\u226B\u0338',
    '&nLeftarrow;': '\u21CD',
    '&nLeftrightarrow;': '\u21CE',
    '&nLl;': '\u22D8\u0338',
    '&nLt;': '\u226A\u20D2',
    '&nLtv;': '\u226A\u0338',
    '&nRightarrow;': '\u21CF',
    '&nVDash;': '\u22AF',
    '&nVdash;': '\u22AE',
    '&nabla;': '\u2207',
    '&nacute;': '\u0144',
    '&nang;': '\u2220\u20D2',
    '&nap;': '\u2249',
    '&napE;': '\u2A70\u0338',
    '&napid;': '\u224B\u0338',
    '&napos;': '\u0149',
    '&napprox;': '\u2249',
    '&natur;': '\u266E',
    '&natural;': '\u266E',
    '&naturals;': '\u2115',
    '&nbsp': '\u00A0',
    '&nbsp;': '\u00A0',
    '&nbump;': '\u224E\u0338',
    '&nbumpe;': '\u224F\u0338',
    '&ncap;': '\u2A43',
    '&ncaron;': '\u0148',
    '&ncedil;': '\u0146',
    '&ncong;': '\u2247',
    '&ncongdot;': '\u2A6D\u0338',
    '&ncup;': '\u2A42',
    '&ncy;': '\u043D',
    '&ndash;': '\u2013',
    '&ne;': '\u2260',
    '&neArr;': '\u21D7',
    '&nearhk;': '\u2924',
    '&nearr;': '\u2197',
    '&nearrow;': '\u2197',
    '&nedot;': '\u2250\u0338',
    '&nequiv;': '\u2262',
    '&nesear;': '\u2928',
    '&nesim;': '\u2242\u0338',
    '&nexist;': '\u2204',
    '&nexists;': '\u2204',
    '&nfr;': '\uD835\uDD2B',
    '&ngE;': '\u2267\u0338',
    '&nge;': '\u2271',
    '&ngeq;': '\u2271',
    '&ngeqq;': '\u2267\u0338',
    '&ngeqslant;': '\u2A7E\u0338',
    '&nges;': '\u2A7E\u0338',
    '&ngsim;': '\u2275',
    '&ngt;': '\u226F',
    '&ngtr;': '\u226F',
    '&nhArr;': '\u21CE',
    '&nharr;': '\u21AE',
    '&nhpar;': '\u2AF2',
    '&ni;': '\u220B',
    '&nis;': '\u22FC',
    '&nisd;': '\u22FA',
    '&niv;': '\u220B',
    '&njcy;': '\u045A',
    '&nlArr;': '\u21CD',
    '&nlE;': '\u2266\u0338',
    '&nlarr;': '\u219A',
    '&nldr;': '\u2025',
    '&nle;': '\u2270',
    '&nleftarrow;': '\u219A',
    '&nleftrightarrow;': '\u21AE',
    '&nleq;': '\u2270',
    '&nleqq;': '\u2266\u0338',
    '&nleqslant;': '\u2A7D\u0338',
    '&nles;': '\u2A7D\u0338',
    '&nless;': '\u226E',
    '&nlsim;': '\u2274',
    '&nlt;': '\u226E',
    '&nltri;': '\u22EA',
    '&nltrie;': '\u22EC',
    '&nmid;': '\u2224',
    '&nopf;': '\uD835\uDD5F',
    '&not': '\u00AC',
    '&not;': '\u00AC',
    '&notin;': '\u2209',
    '&notinE;': '\u22F9\u0338',
    '&notindot;': '\u22F5\u0338',
    '&notinva;': '\u2209',
    '&notinvb;': '\u22F7',
    '&notinvc;': '\u22F6',
    '&notni;': '\u220C',
    '&notniva;': '\u220C',
    '&notnivb;': '\u22FE',
    '&notnivc;': '\u22FD',
    '&npar;': '\u2226',
    '&nparallel;': '\u2226',
    '&nparsl;': '\u2AFD\u20E5',
    '&npart;': '\u2202\u0338',
    '&npolint;': '\u2A14',
    '&npr;': '\u2280',
    '&nprcue;': '\u22E0',
    '&npre;': '\u2AAF\u0338',
    '&nprec;': '\u2280',
    '&npreceq;': '\u2AAF\u0338',
    '&nrArr;': '\u21CF',
    '&nrarr;': '\u219B',
    '&nrarrc;': '\u2933\u0338',
    '&nrarrw;': '\u219D\u0338',
    '&nrightarrow;': '\u219B',
    '&nrtri;': '\u22EB',
    '&nrtrie;': '\u22ED',
    '&nsc;': '\u2281',
    '&nsccue;': '\u22E1',
    '&nsce;': '\u2AB0\u0338',
    '&nscr;': '\uD835\uDCC3',
    '&nshortmid;': '\u2224',
    '&nshortparallel;': '\u2226',
    '&nsim;': '\u2241',
    '&nsime;': '\u2244',
    '&nsimeq;': '\u2244',
    '&nsmid;': '\u2224',
    '&nspar;': '\u2226',
    '&nsqsube;': '\u22E2',
    '&nsqsupe;': '\u22E3',
    '&nsub;': '\u2284',
    '&nsubE;': '\u2AC5\u0338',
    '&nsube;': '\u2288',
    '&nsubset;': '\u2282\u20D2',
    '&nsubseteq;': '\u2288',
    '&nsubseteqq;': '\u2AC5\u0338',
    '&nsucc;': '\u2281',
    '&nsucceq;': '\u2AB0\u0338',
    '&nsup;': '\u2285',
    '&nsupE;': '\u2AC6\u0338',
    '&nsupe;': '\u2289',
    '&nsupset;': '\u2283\u20D2',
    '&nsupseteq;': '\u2289',
    '&nsupseteqq;': '\u2AC6\u0338',
    '&ntgl;': '\u2279',
    '&ntilde': '\u00F1',
    '&ntilde;': '\u00F1',
    '&ntlg;': '\u2278',
    '&ntriangleleft;': '\u22EA',
    '&ntrianglelefteq;': '\u22EC',
    '&ntriangleright;': '\u22EB',
    '&ntrianglerighteq;': '\u22ED',
    '&nu;': '\u03BD',
    '&num;': '\u0023',
    '&numero;': '\u2116',
    '&numsp;': '\u2007',
    '&nvDash;': '\u22AD',
    '&nvHarr;': '\u2904',
    '&nvap;': '\u224D\u20D2',
    '&nvdash;': '\u22AC',
    '&nvge;': '\u2265\u20D2',
    '&nvgt;': '\u003E\u20D2',
    '&nvinfin;': '\u29DE',
    '&nvlArr;': '\u2902',
    '&nvle;': '\u2264\u20D2',
    '&nvlt;': '\u003C\u20D2',
    '&nvltrie;': '\u22B4\u20D2',
    '&nvrArr;': '\u2903',
    '&nvrtrie;': '\u22B5\u20D2',
    '&nvsim;': '\u223C\u20D2',
    '&nwArr;': '\u21D6',
    '&nwarhk;': '\u2923',
    '&nwarr;': '\u2196',
    '&nwarrow;': '\u2196',
    '&nwnear;': '\u2927',
    '&oS;': '\u24C8',
    '&oacute': '\u00F3',
    '&oacute;': '\u00F3',
    '&oast;': '\u229B',
    '&ocir;': '\u229A',
    '&ocirc': '\u00F4',
    '&ocirc;': '\u00F4',
    '&ocy;': '\u043E',
    '&odash;': '\u229D',
    '&odblac;': '\u0151',
    '&odiv;': '\u2A38',
    '&odot;': '\u2299',
    '&odsold;': '\u29BC',
    '&oelig;': '\u0153',
    '&ofcir;': '\u29BF',
    '&ofr;': '\uD835\uDD2C',
    '&ogon;': '\u02DB',
    '&ograve': '\u00F2',
    '&ograve;': '\u00F2',
    '&ogt;': '\u29C1',
    '&ohbar;': '\u29B5',
    '&ohm;': '\u03A9',
    '&oint;': '\u222E',
    '&olarr;': '\u21BA',
    '&olcir;': '\u29BE',
    '&olcross;': '\u29BB',
    '&oline;': '\u203E',
    '&olt;': '\u29C0',
    '&omacr;': '\u014D',
    '&omega;': '\u03C9',
    '&omicron;': '\u03BF',
    '&omid;': '\u29B6',
    '&ominus;': '\u2296',
    '&oopf;': '\uD835\uDD60',
    '&opar;': '\u29B7',
    '&operp;': '\u29B9',
    '&oplus;': '\u2295',
    '&or;': '\u2228',
    '&orarr;': '\u21BB',
    '&ord;': '\u2A5D',
    '&order;': '\u2134',
    '&orderof;': '\u2134',
    '&ordf': '\u00AA',
    '&ordf;': '\u00AA',
    '&ordm': '\u00BA',
    '&ordm;': '\u00BA',
    '&origof;': '\u22B6',
    '&oror;': '\u2A56',
    '&orslope;': '\u2A57',
    '&orv;': '\u2A5B',
    '&oscr;': '\u2134',
    '&oslash': '\u00F8',
    '&oslash;': '\u00F8',
    '&osol;': '\u2298',
    '&otilde': '\u00F5',
    '&otilde;': '\u00F5',
    '&otimes;': '\u2297',
    '&otimesas;': '\u2A36',
    '&ouml': '\u00F6',
    '&ouml;': '\u00F6',
    '&ovbar;': '\u233D',
    '&par;': '\u2225',
    '&para': '\u00B6',
    '&para;': '\u00B6',
    '&parallel;': '\u2225',
    '&parsim;': '\u2AF3',
    '&parsl;': '\u2AFD',
    '&part;': '\u2202',
    '&pcy;': '\u043F',
    '&percnt;': '\u0025',
    '&period;': '\u002E',
    '&permil;': '\u2030',
    '&perp;': '\u22A5',
    '&pertenk;': '\u2031',
    '&pfr;': '\uD835\uDD2D',
    '&phi;': '\u03C6',
    '&phiv;': '\u03D5',
    '&phmmat;': '\u2133',
    '&phone;': '\u260E',
    '&pi;': '\u03C0',
    '&pitchfork;': '\u22D4',
    '&piv;': '\u03D6',
    '&planck;': '\u210F',
    '&planckh;': '\u210E',
    '&plankv;': '\u210F',
    '&plus;': '\u002B',
    '&plusacir;': '\u2A23',
    '&plusb;': '\u229E',
    '&pluscir;': '\u2A22',
    '&plusdo;': '\u2214',
    '&plusdu;': '\u2A25',
    '&pluse;': '\u2A72',
    '&plusmn': '\u00B1',
    '&plusmn;': '\u00B1',
    '&plussim;': '\u2A26',
    '&plustwo;': '\u2A27',
    '&pm;': '\u00B1',
    '&pointint;': '\u2A15',
    '&popf;': '\uD835\uDD61',
    '&pound': '\u00A3',
    '&pound;': '\u00A3',
    '&pr;': '\u227A',
    '&prE;': '\u2AB3',
    '&prap;': '\u2AB7',
    '&prcue;': '\u227C',
    '&pre;': '\u2AAF',
    '&prec;': '\u227A',
    '&precapprox;': '\u2AB7',
    '&preccurlyeq;': '\u227C',
    '&preceq;': '\u2AAF',
    '&precnapprox;': '\u2AB9',
    '&precneqq;': '\u2AB5',
    '&precnsim;': '\u22E8',
    '&precsim;': '\u227E',
    '&prime;': '\u2032',
    '&primes;': '\u2119',
    '&prnE;': '\u2AB5',
    '&prnap;': '\u2AB9',
    '&prnsim;': '\u22E8',
    '&prod;': '\u220F',
    '&profalar;': '\u232E',
    '&profline;': '\u2312',
    '&profsurf;': '\u2313',
    '&prop;': '\u221D',
    '&propto;': '\u221D',
    '&prsim;': '\u227E',
    '&prurel;': '\u22B0',
    '&pscr;': '\uD835\uDCC5',
    '&psi;': '\u03C8',
    '&puncsp;': '\u2008',
    '&qfr;': '\uD835\uDD2E',
    '&qint;': '\u2A0C',
    '&qopf;': '\uD835\uDD62',
    '&qprime;': '\u2057',
    '&qscr;': '\uD835\uDCC6',
    '&quaternions;': '\u210D',
    '&quatint;': '\u2A16',
    '&quest;': '\u003F',
    '&questeq;': '\u225F',
    '&quot': '\u0022',
    '&quot;': '\u0022',
    '&rAarr;': '\u21DB',
    '&rArr;': '\u21D2',
    '&rAtail;': '\u291C',
    '&rBarr;': '\u290F',
    '&rHar;': '\u2964',
    '&race;': '\u223D\u0331',
    '&racute;': '\u0155',
    '&radic;': '\u221A',
    '&raemptyv;': '\u29B3',
    '&rang;': '\u27E9',
    '&rangd;': '\u2992',
    '&range;': '\u29A5',
    '&rangle;': '\u27E9',
    '&raquo': '\u00BB',
    '&raquo;': '\u00BB',
    '&rarr;': '\u2192',
    '&rarrap;': '\u2975',
    '&rarrb;': '\u21E5',
    '&rarrbfs;': '\u2920',
    '&rarrc;': '\u2933',
    '&rarrfs;': '\u291E',
    '&rarrhk;': '\u21AA',
    '&rarrlp;': '\u21AC',
    '&rarrpl;': '\u2945',
    '&rarrsim;': '\u2974',
    '&rarrtl;': '\u21A3',
    '&rarrw;': '\u219D',
    '&ratail;': '\u291A',
    '&ratio;': '\u2236',
    '&rationals;': '\u211A',
    '&rbarr;': '\u290D',
    '&rbbrk;': '\u2773',
    '&rbrace;': '\u007D',
    '&rbrack;': '\u005D',
    '&rbrke;': '\u298C',
    '&rbrksld;': '\u298E',
    '&rbrkslu;': '\u2990',
    '&rcaron;': '\u0159',
    '&rcedil;': '\u0157',
    '&rceil;': '\u2309',
    '&rcub;': '\u007D',
    '&rcy;': '\u0440',
    '&rdca;': '\u2937',
    '&rdldhar;': '\u2969',
    '&rdquo;': '\u201D',
    '&rdquor;': '\u201D',
    '&rdsh;': '\u21B3',
    '&real;': '\u211C',
    '&realine;': '\u211B',
    '&realpart;': '\u211C',
    '&reals;': '\u211D',
    '&rect;': '\u25AD',
    '&reg': '\u00AE',
    '&reg;': '\u00AE',
    '&rfisht;': '\u297D',
    '&rfloor;': '\u230B',
    '&rfr;': '\uD835\uDD2F',
    '&rhard;': '\u21C1',
    '&rharu;': '\u21C0',
    '&rharul;': '\u296C',
    '&rho;': '\u03C1',
    '&rhov;': '\u03F1',
    '&rightarrow;': '\u2192',
    '&rightarrowtail;': '\u21A3',
    '&rightharpoondown;': '\u21C1',
    '&rightharpoonup;': '\u21C0',
    '&rightleftarrows;': '\u21C4',
    '&rightleftharpoons;': '\u21CC',
    '&rightrightarrows;': '\u21C9',
    '&rightsquigarrow;': '\u219D',
    '&rightthreetimes;': '\u22CC',
    '&ring;': '\u02DA',
    '&risingdotseq;': '\u2253',
    '&rlarr;': '\u21C4',
    '&rlhar;': '\u21CC',
    '&rlm;': '\u200F',
    '&rmoust;': '\u23B1',
    '&rmoustache;': '\u23B1',
    '&rnmid;': '\u2AEE',
    '&roang;': '\u27ED',
    '&roarr;': '\u21FE',
    '&robrk;': '\u27E7',
    '&ropar;': '\u2986',
    '&ropf;': '\uD835\uDD63',
    '&roplus;': '\u2A2E',
    '&rotimes;': '\u2A35',
    '&rpar;': '\u0029',
    '&rpargt;': '\u2994',
    '&rppolint;': '\u2A12',
    '&rrarr;': '\u21C9',
    '&rsaquo;': '\u203A',
    '&rscr;': '\uD835\uDCC7',
    '&rsh;': '\u21B1',
    '&rsqb;': '\u005D',
    '&rsquo;': '\u2019',
    '&rsquor;': '\u2019',
    '&rthree;': '\u22CC',
    '&rtimes;': '\u22CA',
    '&rtri;': '\u25B9',
    '&rtrie;': '\u22B5',
    '&rtrif;': '\u25B8',
    '&rtriltri;': '\u29CE',
    '&ruluhar;': '\u2968',
    '&rx;': '\u211E',
    '&sacute;': '\u015B',
    '&sbquo;': '\u201A',
    '&sc;': '\u227B',
    '&scE;': '\u2AB4',
    '&scap;': '\u2AB8',
    '&scaron;': '\u0161',
    '&sccue;': '\u227D',
    '&sce;': '\u2AB0',
    '&scedil;': '\u015F',
    '&scirc;': '\u015D',
    '&scnE;': '\u2AB6',
    '&scnap;': '\u2ABA',
    '&scnsim;': '\u22E9',
    '&scpolint;': '\u2A13',
    '&scsim;': '\u227F',
    '&scy;': '\u0441',
    '&sdot;': '\u22C5',
    '&sdotb;': '\u22A1',
    '&sdote;': '\u2A66',
    '&seArr;': '\u21D8',
    '&searhk;': '\u2925',
    '&searr;': '\u2198',
    '&searrow;': '\u2198',
    '&sect': '\u00A7',
    '&sect;': '\u00A7',
    '&semi;': '\u003B',
    '&seswar;': '\u2929',
    '&setminus;': '\u2216',
    '&setmn;': '\u2216',
    '&sext;': '\u2736',
    '&sfr;': '\uD835\uDD30',
    '&sfrown;': '\u2322',
    '&sharp;': '\u266F',
    '&shchcy;': '\u0449',
    '&shcy;': '\u0448',
    '&shortmid;': '\u2223',
    '&shortparallel;': '\u2225',
    '&shy': '\u00AD',
    '&shy;': '\u00AD',
    '&sigma;': '\u03C3',
    '&sigmaf;': '\u03C2',
    '&sigmav;': '\u03C2',
    '&sim;': '\u223C',
    '&simdot;': '\u2A6A',
    '&sime;': '\u2243',
    '&simeq;': '\u2243',
    '&simg;': '\u2A9E',
    '&simgE;': '\u2AA0',
    '&siml;': '\u2A9D',
    '&simlE;': '\u2A9F',
    '&simne;': '\u2246',
    '&simplus;': '\u2A24',
    '&simrarr;': '\u2972',
    '&slarr;': '\u2190',
    '&smallsetminus;': '\u2216',
    '&smashp;': '\u2A33',
    '&smeparsl;': '\u29E4',
    '&smid;': '\u2223',
    '&smile;': '\u2323',
    '&smt;': '\u2AAA',
    '&smte;': '\u2AAC',
    '&smtes;': '\u2AAC\uFE00',
    '&softcy;': '\u044C',
    '&sol;': '\u002F',
    '&solb;': '\u29C4',
    '&solbar;': '\u233F',
    '&sopf;': '\uD835\uDD64',
    '&spades;': '\u2660',
    '&spadesuit;': '\u2660',
    '&spar;': '\u2225',
    '&sqcap;': '\u2293',
    '&sqcaps;': '\u2293\uFE00',
    '&sqcup;': '\u2294',
    '&sqcups;': '\u2294\uFE00',
    '&sqsub;': '\u228F',
    '&sqsube;': '\u2291',
    '&sqsubset;': '\u228F',
    '&sqsubseteq;': '\u2291',
    '&sqsup;': '\u2290',
    '&sqsupe;': '\u2292',
    '&sqsupset;': '\u2290',
    '&sqsupseteq;': '\u2292',
    '&squ;': '\u25A1',
    '&square;': '\u25A1',
    '&squarf;': '\u25AA',
    '&squf;': '\u25AA',
    '&srarr;': '\u2192',
    '&sscr;': '\uD835\uDCC8',
    '&ssetmn;': '\u2216',
    '&ssmile;': '\u2323',
    '&sstarf;': '\u22C6',
    '&star;': '\u2606',
    '&starf;': '\u2605',
    '&straightepsilon;': '\u03F5',
    '&straightphi;': '\u03D5',
    '&strns;': '\u00AF',
    '&sub;': '\u2282',
    '&subE;': '\u2AC5',
    '&subdot;': '\u2ABD',
    '&sube;': '\u2286',
    '&subedot;': '\u2AC3',
    '&submult;': '\u2AC1',
    '&subnE;': '\u2ACB',
    '&subne;': '\u228A',
    '&subplus;': '\u2ABF',
    '&subrarr;': '\u2979',
    '&subset;': '\u2282',
    '&subseteq;': '\u2286',
    '&subseteqq;': '\u2AC5',
    '&subsetneq;': '\u228A',
    '&subsetneqq;': '\u2ACB',
    '&subsim;': '\u2AC7',
    '&subsub;': '\u2AD5',
    '&subsup;': '\u2AD3',
    '&succ;': '\u227B',
    '&succapprox;': '\u2AB8',
    '&succcurlyeq;': '\u227D',
    '&succeq;': '\u2AB0',
    '&succnapprox;': '\u2ABA',
    '&succneqq;': '\u2AB6',
    '&succnsim;': '\u22E9',
    '&succsim;': '\u227F',
    '&sum;': '\u2211',
    '&sung;': '\u266A',
    '&sup1': '\u00B9',
    '&sup1;': '\u00B9',
    '&sup2': '\u00B2',
    '&sup2;': '\u00B2',
    '&sup3': '\u00B3',
    '&sup3;': '\u00B3',
    '&sup;': '\u2283',
    '&supE;': '\u2AC6',
    '&supdot;': '\u2ABE',
    '&supdsub;': '\u2AD8',
    '&supe;': '\u2287',
    '&supedot;': '\u2AC4',
    '&suphsol;': '\u27C9',
    '&suphsub;': '\u2AD7',
    '&suplarr;': '\u297B',
    '&supmult;': '\u2AC2',
    '&supnE;': '\u2ACC',
    '&supne;': '\u228B',
    '&supplus;': '\u2AC0',
    '&supset;': '\u2283',
    '&supseteq;': '\u2287',
    '&supseteqq;': '\u2AC6',
    '&supsetneq;': '\u228B',
    '&supsetneqq;': '\u2ACC',
    '&supsim;': '\u2AC8',
    '&supsub;': '\u2AD4',
    '&supsup;': '\u2AD6',
    '&swArr;': '\u21D9',
    '&swarhk;': '\u2926',
    '&swarr;': '\u2199',
    '&swarrow;': '\u2199',
    '&swnwar;': '\u292A',
    '&szlig': '\u00DF',
    '&szlig;': '\u00DF',
    '&target;': '\u2316',
    '&tau;': '\u03C4',
    '&tbrk;': '\u23B4',
    '&tcaron;': '\u0165',
    '&tcedil;': '\u0163',
    '&tcy;': '\u0442',
    '&tdot;': '\u20DB',
    '&telrec;': '\u2315',
    '&tfr;': '\uD835\uDD31',
    '&there4;': '\u2234',
    '&therefore;': '\u2234',
    '&theta;': '\u03B8',
    '&thetasym;': '\u03D1',
    '&thetav;': '\u03D1',
    '&thickapprox;': '\u2248',
    '&thicksim;': '\u223C',
    '&thinsp;': '\u2009',
    '&thkap;': '\u2248',
    '&thksim;': '\u223C',
    '&thorn': '\u00FE',
    '&thorn;': '\u00FE',
    '&tilde;': '\u02DC',
    '&times': '\u00D7',
    '&times;': '\u00D7',
    '&timesb;': '\u22A0',
    '&timesbar;': '\u2A31',
    '&timesd;': '\u2A30',
    '&tint;': '\u222D',
    '&toea;': '\u2928',
    '&top;': '\u22A4',
    '&topbot;': '\u2336',
    '&topcir;': '\u2AF1',
    '&topf;': '\uD835\uDD65',
    '&topfork;': '\u2ADA',
    '&tosa;': '\u2929',
    '&tprime;': '\u2034',
    '&trade;': '\u2122',
    '&triangle;': '\u25B5',
    '&triangledown;': '\u25BF',
    '&triangleleft;': '\u25C3',
    '&trianglelefteq;': '\u22B4',
    '&triangleq;': '\u225C',
    '&triangleright;': '\u25B9',
    '&trianglerighteq;': '\u22B5',
    '&tridot;': '\u25EC',
    '&trie;': '\u225C',
    '&triminus;': '\u2A3A',
    '&triplus;': '\u2A39',
    '&trisb;': '\u29CD',
    '&tritime;': '\u2A3B',
    '&trpezium;': '\u23E2',
    '&tscr;': '\uD835\uDCC9',
    '&tscy;': '\u0446',
    '&tshcy;': '\u045B',
    '&tstrok;': '\u0167',
    '&twixt;': '\u226C',
    '&twoheadleftarrow;': '\u219E',
    '&twoheadrightarrow;': '\u21A0',
    '&uArr;': '\u21D1',
    '&uHar;': '\u2963',
    '&uacute': '\u00FA',
    '&uacute;': '\u00FA',
    '&uarr;': '\u2191',
    '&ubrcy;': '\u045E',
    '&ubreve;': '\u016D',
    '&ucirc': '\u00FB',
    '&ucirc;': '\u00FB',
    '&ucy;': '\u0443',
    '&udarr;': '\u21C5',
    '&udblac;': '\u0171',
    '&udhar;': '\u296E',
    '&ufisht;': '\u297E',
    '&ufr;': '\uD835\uDD32',
    '&ugrave': '\u00F9',
    '&ugrave;': '\u00F9',
    '&uharl;': '\u21BF',
    '&uharr;': '\u21BE',
    '&uhblk;': '\u2580',
    '&ulcorn;': '\u231C',
    '&ulcorner;': '\u231C',
    '&ulcrop;': '\u230F',
    '&ultri;': '\u25F8',
    '&umacr;': '\u016B',
    '&uml': '\u00A8',
    '&uml;': '\u00A8',
    '&uogon;': '\u0173',
    '&uopf;': '\uD835\uDD66',
    '&uparrow;': '\u2191',
    '&updownarrow;': '\u2195',
    '&upharpoonleft;': '\u21BF',
    '&upharpoonright;': '\u21BE',
    '&uplus;': '\u228E',
    '&upsi;': '\u03C5',
    '&upsih;': '\u03D2',
    '&upsilon;': '\u03C5',
    '&upuparrows;': '\u21C8',
    '&urcorn;': '\u231D',
    '&urcorner;': '\u231D',
    '&urcrop;': '\u230E',
    '&uring;': '\u016F',
    '&urtri;': '\u25F9',
    '&uscr;': '\uD835\uDCCA',
    '&utdot;': '\u22F0',
    '&utilde;': '\u0169',
    '&utri;': '\u25B5',
    '&utrif;': '\u25B4',
    '&uuarr;': '\u21C8',
    '&uuml': '\u00FC',
    '&uuml;': '\u00FC',
    '&uwangle;': '\u29A7',
    '&vArr;': '\u21D5',
    '&vBar;': '\u2AE8',
    '&vBarv;': '\u2AE9',
    '&vDash;': '\u22A8',
    '&vangrt;': '\u299C',
    '&varepsilon;': '\u03F5',
    '&varkappa;': '\u03F0',
    '&varnothing;': '\u2205',
    '&varphi;': '\u03D5',
    '&varpi;': '\u03D6',
    '&varpropto;': '\u221D',
    '&varr;': '\u2195',
    '&varrho;': '\u03F1',
    '&varsigma;': '\u03C2',
    '&varsubsetneq;': '\u228A\uFE00',
    '&varsubsetneqq;': '\u2ACB\uFE00',
    '&varsupsetneq;': '\u228B\uFE00',
    '&varsupsetneqq;': '\u2ACC\uFE00',
    '&vartheta;': '\u03D1',
    '&vartriangleleft;': '\u22B2',
    '&vartriangleright;': '\u22B3',
    '&vcy;': '\u0432',
    '&vdash;': '\u22A2',
    '&vee;': '\u2228',
    '&veebar;': '\u22BB',
    '&veeeq;': '\u225A',
    '&vellip;': '\u22EE',
    '&verbar;': '\u007C',
    '&vert;': '\u007C',
    '&vfr;': '\uD835\uDD33',
    '&vltri;': '\u22B2',
    '&vnsub;': '\u2282\u20D2',
    '&vnsup;': '\u2283\u20D2',
    '&vopf;': '\uD835\uDD67',
    '&vprop;': '\u221D',
    '&vrtri;': '\u22B3',
    '&vscr;': '\uD835\uDCCB',
    '&vsubnE;': '\u2ACB\uFE00',
    '&vsubne;': '\u228A\uFE00',
    '&vsupnE;': '\u2ACC\uFE00',
    '&vsupne;': '\u228B\uFE00',
    '&vzigzag;': '\u299A',
    '&wcirc;': '\u0175',
    '&wedbar;': '\u2A5F',
    '&wedge;': '\u2227',
    '&wedgeq;': '\u2259',
    '&weierp;': '\u2118',
    '&wfr;': '\uD835\uDD34',
    '&wopf;': '\uD835\uDD68',
    '&wp;': '\u2118',
    '&wr;': '\u2240',
    '&wreath;': '\u2240',
    '&wscr;': '\uD835\uDCCC',
    '&xcap;': '\u22C2',
    '&xcirc;': '\u25EF',
    '&xcup;': '\u22C3',
    '&xdtri;': '\u25BD',
    '&xfr;': '\uD835\uDD35',
    '&xhArr;': '\u27FA',
    '&xharr;': '\u27F7',
    '&xi;': '\u03BE',
    '&xlArr;': '\u27F8',
    '&xlarr;': '\u27F5',
    '&xmap;': '\u27FC',
    '&xnis;': '\u22FB',
    '&xodot;': '\u2A00',
    '&xopf;': '\uD835\uDD69',
    '&xoplus;': '\u2A01',
    '&xotime;': '\u2A02',
    '&xrArr;': '\u27F9',
    '&xrarr;': '\u27F6',
    '&xscr;': '\uD835\uDCCD',
    '&xsqcup;': '\u2A06',
    '&xuplus;': '\u2A04',
    '&xutri;': '\u25B3',
    '&xvee;': '\u22C1',
    '&xwedge;': '\u22C0',
    '&yacute': '\u00FD',
    '&yacute;': '\u00FD',
    '&yacy;': '\u044F',
    '&ycirc;': '\u0177',
    '&ycy;': '\u044B',
    '&yen': '\u00A5',
    '&yen;': '\u00A5',
    '&yfr;': '\uD835\uDD36',
    '&yicy;': '\u0457',
    '&yopf;': '\uD835\uDD6A',
    '&yscr;': '\uD835\uDCCE',
    '&yucy;': '\u044E',
    '&yuml': '\u00FF',
    '&yuml;': '\u00FF',
    '&zacute;': '\u017A',
    '&zcaron;': '\u017E',
    '&zcy;': '\u0437',
    '&zdot;': '\u017C',
    '&zeetrf;': '\u2128',
    '&zeta;': '\u03B6',
    '&zfr;': '\uD835\uDD37',
    '&zhcy;': '\u0436',
    '&zigrarr;': '\u21DD',
    '&zopf;': '\uD835\uDD6B',
    '&zscr;': '\uD835\uDCCF',
    '&zwj;': '\u200D',
    '&zwnj;': '\u200C'
};

function decodeHTMLEntities(str) {
    return str.replace(/&(#\d+|#x[a-f0-9]+|[a-z]+\d*);?/gi, (match, entity) => {
        if (typeof htmlEntities[match] === 'string') {
            return htmlEntities[match];
        }

        if (entity.charAt(0) !== '#' || match.charAt(match.length - 1) !== ';') {
            // keep as is, invalid or unknown sequence
            return match;
        }

        let codePoint;
        if (entity.charAt(1) === 'x') {
            // hex
            codePoint = parseInt(entity.substr(2), 16);
        } else {
            // dec
            codePoint = parseInt(entity.substr(1), 10);
        }

        let output = '';

        if ((codePoint >= 0xd800 && codePoint <= 0xdfff) || codePoint > 0x10ffff) {
            // Invalid range, return a replacement character instead
            return '\uFFFD';
        }

        if (codePoint > 0xffff) {
            codePoint -= 0x10000;
            output += String.fromCharCode(((codePoint >>> 10) & 0x3ff) | 0xd800);
            codePoint = 0xdc00 | (codePoint & 0x3ff);
        }

        output += String.fromCharCode(codePoint);

        return output;
    });
}

function escapeHtml(str) {
    return str.trim().replace(/[<>"'?&]/g, c => {
        let hex = c.charCodeAt(0).toString(16);
        if (hex.length < 2) {
            hex = '0' + hex;
        }
        return '&#x' + hex.toUpperCase() + ';';
    });
}

function textToHtml(str) {
    let html = escapeHtml(str).replace(/\n/g, '<br />');
    return '<div>' + html + '</div>';
}

function htmlToText(str) {
    str = str
        // we can't process tags on multiple lines so remove newlines first
        .replace(/\r?\n/g, '\u0001')
        .replace(/<\!\-\-.*?\-\->/gi, ' ')

        .replace(/<br\b[^>]*>/gi, '\n')
        .replace(/<\/?(p|div|table|tr|td|th)\b[^>]*>/gi, '\n\n')
        .replace(/<script\b[^>]*>.*?<\/script\b[^>]*>/gi, ' ')
        .replace(/^.*<body\b[^>]*>/i, '')
        .replace(/^.*<\/head\b[^>]*>/i, '')
        .replace(/^.*<\!doctype\b[^>]*>/i, '')
        .replace(/<\/body\b[^>]*>.*$/i, '')
        .replace(/<\/html\b[^>]*>.*$/i, '')

        .replace(/<a\b[^>]*href\s*=\s*["']?([^\s"']+)[^>]*>/gi, ' ($1) ')

        .replace(/<\/?(span|em|i|strong|b|u|a)\b[^>]*>/gi, '')

        .replace(/<li\b[^>]*>[\n\u0001\s]*/gi, '* ')

        .replace(/<hr\b[^>]*>/g, '\n-------------\n')

        .replace(/<[^>]*>/g, ' ')

        // convert linebreak placeholders back to newlines
        .replace(/\u0001/g, '\n')

        .replace(/[ \t]+/g, ' ')

        .replace(/^\s+$/gm, '')

        .replace(/\n\n+/g, '\n\n')
        .replace(/^\n+/, '\n')
        .replace(/\n+$/, '\n');

    str = decodeHTMLEntities(str);

    return str;
}

function formatTextAddress(address) {
    return []
        .concat(address.name || [])
        .concat(address.name ? `<${address.address}>` : address.address)
        .join(' ');
}

function formatTextAddresses(addresses) {
    let parts = [];

    let processAddress = (address, partCounter) => {
        if (partCounter) {
            parts.push(', ');
        }

        if (address.group) {
            let groupStart = `${address.name}:`;
            let groupEnd = `;`;

            parts.push(groupStart);
            address.group.forEach(processAddress);
            parts.push(groupEnd);
        } else {
            parts.push(formatTextAddress(address));
        }
    };

    addresses.forEach(processAddress);

    return parts.join('');
}

function formatHtmlAddress(address) {
    return `<a href="mailto:${escapeHtml(address.address)}" class="postal-email-address">${escapeHtml(address.name || `<${address.address}>`)}</a>`;
}

function formatHtmlAddresses(addresses) {
    let parts = [];

    let processAddress = (address, partCounter) => {
        if (partCounter) {
            parts.push('<span class="postal-email-address-separator">, </span>');
        }

        if (address.group) {
            let groupStart = `<span class="postal-email-address-group">${escapeHtml(address.name)}:</span>`;
            let groupEnd = `<span class="postal-email-address-group">;</span>`;

            parts.push(groupStart);
            address.group.forEach(processAddress);
            parts.push(groupEnd);
        } else {
            parts.push(formatHtmlAddress(address));
        }
    };

    addresses.forEach(processAddress);

    return parts.join(' ');
}

function foldLines(str, lineLength, afterSpace) {
    str = (str || '').toString();
    lineLength = lineLength || 76;

    let pos = 0,
        len = str.length,
        result = '',
        line,
        match;

    while (pos < len) {
        line = str.substr(pos, lineLength);
        if (line.length < lineLength) {
            result += line;
            break;
        }
        if ((match = line.match(/^[^\n\r]*(\r?\n|\r)/))) {
            line = match[0];
            result += line;
            pos += line.length;
            continue;
        } else if (
            (match = line.match(/(\s+)[^\s]*$/)) &&
            match[0].length - ((match[1] || '').length ) < line.length
        ) {
            line = line.substr(0, line.length - (match[0].length - ((match[1] || '').length )));
        } else if ((match = str.substr(pos + line.length).match(/^[^\s]+(\s*)/))) {
            line = line + match[0].substr(0, match[0].length - (0));
        }

        result += line;
        pos += line.length;
        if (pos < len) {
            result += '\r\n';
        }
    }

    return result;
}

function formatTextHeader(message) {
    let rows = [];

    if (message.from) {
        rows.push({ key: 'From', val: formatTextAddress(message.from) });
    }

    if (message.subject) {
        rows.push({ key: 'Subject', val: message.subject });
    }

    if (message.date) {
        let dateOptions = {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric',
            hour12: false
        };

        let dateStr =
            typeof Intl === 'undefined'
                ? message.date
                : new Intl.DateTimeFormat('default', dateOptions).format(new Date(message.date));

        rows.push({ key: 'Date', val: dateStr });
    }

    if (message.to && message.to.length) {
        rows.push({ key: 'To', val: formatTextAddresses(message.to) });
    }

    if (message.cc && message.cc.length) {
        rows.push({ key: 'Cc', val: formatTextAddresses(message.cc) });
    }

    if (message.bcc && message.bcc.length) {
        rows.push({ key: 'Bcc', val: formatTextAddresses(message.bcc) });
    }

    // Align keys and values by adding space between these two
    // Also make sure that the separator line is as long as the longest line
    // Should end up with something like this:
    /*
    -----------------------------
    From:    xx xx <xxx@xxx.com>
    Subject: Example Subject
    Date:    16/02/2021, 02:57:06
    To:      not@found.com
    -----------------------------
    */

    let maxKeyLength = rows
        .map(r => r.key.length)
        .reduce((acc, cur) => {
            return cur > acc ? cur : acc;
        }, 0);

    rows = rows.flatMap(row => {
        let sepLen = maxKeyLength - row.key.length;
        let prefix = `${row.key}: ${' '.repeat(sepLen)}`;
        let emptyPrefix = `${' '.repeat(row.key.length + 1)} ${' '.repeat(sepLen)}`;

        let foldedLines = foldLines(row.val, 80)
            .split(/\r?\n/)
            .map(line => line.trim());

        return foldedLines.map((line, i) => `${i ? emptyPrefix : prefix}${line}`);
    });

    let maxLineLength = rows
        .map(r => r.length)
        .reduce((acc, cur) => {
            return cur > acc ? cur : acc;
        }, 0);

    let lineMarker = '-'.repeat(maxLineLength);

    let template = `
${lineMarker}
${rows.join('\n')}
${lineMarker}
`;

    return template;
}

function formatHtmlHeader(message) {
    let rows = [];

    if (message.from) {
        rows.push(
            `<div class="postal-email-header-key">From</div><div class="postal-email-header-value">${formatHtmlAddress(message.from)}</div>`
        );
    }

    if (message.subject) {
        rows.push(
            `<div class="postal-email-header-key">Subject</div><div class="postal-email-header-value postal-email-header-subject">${escapeHtml(
                message.subject
            )}</div>`
        );
    }

    if (message.date) {
        let dateOptions = {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric',
            hour12: false
        };

        let dateStr =
            typeof Intl === 'undefined'
                ? message.date
                : new Intl.DateTimeFormat('default', dateOptions).format(new Date(message.date));

        rows.push(
            `<div class="postal-email-header-key">Date</div><div class="postal-email-header-value postal-email-header-date" data-date="${escapeHtml(
                message.date
            )}">${escapeHtml(dateStr)}</div>`
        );
    }

    if (message.to && message.to.length) {
        rows.push(
            `<div class="postal-email-header-key">To</div><div class="postal-email-header-value">${formatHtmlAddresses(message.to)}</div>`
        );
    }

    if (message.cc && message.cc.length) {
        rows.push(
            `<div class="postal-email-header-key">Cc</div><div class="postal-email-header-value">${formatHtmlAddresses(message.cc)}</div>`
        );
    }

    if (message.bcc && message.bcc.length) {
        rows.push(
            `<div class="postal-email-header-key">Bcc</div><div class="postal-email-header-value">${formatHtmlAddresses(message.bcc)}</div>`
        );
    }

    let template = `<div class="postal-email-header">${rows.length ? '<div class="postal-email-header-row">' : ''}${rows.join(
        '</div>\n<div class="postal-email-header-row">'
    )}${rows.length ? '</div>' : ''}</div>`;

    return template;
}

/**
 * Converts tokens for a single address into an address object
 *
 * @param {Array} tokens Tokens object
 * @param {Number} depth Current recursion depth for nested group protection
 * @return {Object} Address object
 */
function _handleAddress(tokens, depth) {
    let isGroup = false;
    let state = 'text';
    let address;
    let addresses = [];
    let data = {
        address: [],
        comment: [],
        group: [],
        text: [],
        textWasQuoted: [] // Track which text tokens came from inside quotes
    };
    let i;
    let len;
    let insideQuotes = false; // Track if we're currently inside a quoted string

    // Filter out <addresses>, (comments) and regular text
    for (i = 0, len = tokens.length; i < len; i++) {
        let token = tokens[i];
        let prevToken = i ? tokens[i - 1] : null;
        if (token.type === 'operator') {
            switch (token.value) {
                case '<':
                    state = 'address';
                    insideQuotes = false;
                    break;
                case '(':
                    state = 'comment';
                    insideQuotes = false;
                    break;
                case ':':
                    state = 'group';
                    isGroup = true;
                    insideQuotes = false;
                    break;
                case '"':
                    // Track quote state for text tokens
                    insideQuotes = !insideQuotes;
                    state = 'text';
                    break;
                default:
                    state = 'text';
                    insideQuotes = false;
                    break;
            }
        } else if (token.value) {
            if (state === 'address') {
                // handle use case where unquoted name includes a "<"
                // Apple Mail truncates everything between an unexpected < and an address
                // and so will we
                token.value = token.value.replace(/^[^<]*<\s*/, '');
            }

            if (prevToken && prevToken.noBreak && data[state].length) {
                // join values
                data[state][data[state].length - 1] += token.value;
                if (state === 'text' && insideQuotes) {
                    data.textWasQuoted[data.textWasQuoted.length - 1] = true;
                }
            } else {
                data[state].push(token.value);
                if (state === 'text') {
                    data.textWasQuoted.push(insideQuotes);
                }
            }
        }
    }

    // If there is no text but a comment, replace the two
    if (!data.text.length && data.comment.length) {
        data.text = data.comment;
        data.comment = [];
    }

    if (isGroup) {
        // http://tools.ietf.org/html/rfc2822#appendix-A.1.3
        data.text = data.text.join(' ');

        // Parse group members, but flatten any nested groups (RFC 5322 doesn't allow nesting)
        let groupMembers = [];
        if (data.group.length) {
            let parsedGroup = addressParser(data.group.join(','), { _depth: depth + 1 });
            // Flatten: if any member is itself a group, extract its members into the sequence
            parsedGroup.forEach(member => {
                if (member.group) {
                    // Nested group detected - flatten it by adding its members directly
                    groupMembers = groupMembers.concat(member.group);
                } else {
                    groupMembers.push(member);
                }
            });
        }

        addresses.push({
            name: decodeWords(data.text || (address && address.name)),
            group: groupMembers
        });
    } else {
        // If no address was found, try to detect one from regular text
        if (!data.address.length && data.text.length) {
            for (i = data.text.length - 1; i >= 0; i--) {
                // Security fix: Do not extract email addresses from quoted strings
                // RFC 5321 allows @ inside quoted local-parts like "user@domain"@example.com
                // Extracting emails from quoted text leads to misrouting vulnerabilities
                if (!data.textWasQuoted[i] && data.text[i].match(/^[^@\s]+@[^@\s]+$/)) {
                    data.address = data.text.splice(i, 1);
                    data.textWasQuoted.splice(i, 1);
                    break;
                }
            }

            let _regexHandler = function (address) {
                if (!data.address.length) {
                    data.address = [address.trim()];
                    return ' ';
                } else {
                    return address;
                }
            };

            // still no address
            if (!data.address.length) {
                for (i = data.text.length - 1; i >= 0; i--) {
                    // Security fix: Do not extract email addresses from quoted strings
                    if (!data.textWasQuoted[i]) {
                        // fixed the regex to parse email address correctly when email address has more than one @
                        data.text[i] = data.text[i].replace(/\s*\b[^@\s]+@[^\s]+\b\s*/, _regexHandler).trim();
                        if (data.address.length) {
                            break;
                        }
                    }
                }
            }
        }

        // If there's still no text but a comment exists, replace the two
        if (!data.text.length && data.comment.length) {
            data.text = data.comment;
            data.comment = [];
        }

        // Keep only the first address occurrence, push others to regular text
        if (data.address.length > 1) {
            data.text = data.text.concat(data.address.splice(1));
        }

        // Join values with spaces
        data.text = data.text.join(' ');
        data.address = data.address.join(' ');

        if (!data.address && /^=\?[^=]+?=$/.test(data.text.trim())) {
            // try to extract words from text content
            const decodedText = decodeWords(data.text);
            // Security: only re-parse if decoded text contains angle-bracket addresses.
            // Without this, a bare encoded email (e.g. =?utf-8?B?dGVzdEBldmlsLmNv?=)
            // would be fabricated into an address from attacker-controlled input.
            if (/<[^<>]+@[^<>]+>/.test(decodedText)) {
                const parsedSubAddresses = addressParser(decodedText);
                if (parsedSubAddresses && parsedSubAddresses.length) {
                    return parsedSubAddresses;
                }
            }
            // No usable address found - treat decoded text as display name only
            return [{ address: '', name: decodedText }];
        }

        address = {
            address: data.address || data.text || '',
            name: decodeWords(data.text || data.address || '')
        };

        if (address.address === address.name) {
            if ((address.address || '').match(/@/)) {
                address.name = '';
            } else {
                address.address = '';
            }
        }

        addresses.push(address);
    }

    return addresses;
}

/**
 * Creates a Tokenizer object for tokenizing address field strings
 *
 * @constructor
 * @param {String} str Address field string
 */
class Tokenizer {
    constructor(str) {
        this.str = (str || '').toString();
        this.operatorCurrent = '';
        this.operatorExpecting = '';
        this.node = null;
        this.escaped = false;

        this.list = [];
        /**
         * Operator tokens and which tokens are expected to end the sequence
         */
        this.operators = {
            '"': '"',
            '(': ')',
            '<': '>',
            ',': '',
            ':': ';',
            // Semicolons are not a legal delimiter per the RFC2822 grammar other
            // than for terminating a group, but they are also not valid for any
            // other use in this context.  Given that some mail clients have
            // historically allowed the semicolon as a delimiter equivalent to the
            // comma in their UI, it makes sense to treat them the same as a comma
            // when used outside of a group.
            ';': ''
        };
    }

    /**
     * Tokenizes the original input string
     *
     * @return {Array} An array of operator|text tokens
     */
    tokenize() {
        let list = [];

        for (let i = 0, len = this.str.length; i < len; i++) {
            let chr = this.str.charAt(i);
            let nextChr = i < len - 1 ? this.str.charAt(i + 1) : null;
            this.checkChar(chr, nextChr);
        }

        this.list.forEach(node => {
            node.value = (node.value || '').toString().trim();
            if (node.value) {
                list.push(node);
            }
        });

        return list;
    }

    /**
     * Checks if a character is an operator or text and acts accordingly
     *
     * @param {String} chr Character from the address field
     */
    checkChar(chr, nextChr) {
        if (this.escaped) ; else if (chr === this.operatorExpecting) {
            this.node = {
                type: 'operator',
                value: chr
            };

            if (nextChr && ![' ', '\t', '\r', '\n', ',', ';'].includes(nextChr)) {
                this.node.noBreak = true;
            }

            this.list.push(this.node);
            this.node = null;
            this.operatorExpecting = '';
            this.escaped = false;

            return;
        } else if (!this.operatorExpecting && chr in this.operators) {
            this.node = {
                type: 'operator',
                value: chr
            };
            this.list.push(this.node);
            this.node = null;
            this.operatorExpecting = this.operators[chr];
            this.escaped = false;
            return;
        } else if (this.operatorExpecting === '"' && chr === '\\') {
            this.escaped = true;
            return;
        }

        if (!this.node) {
            this.node = {
                type: 'text',
                value: ''
            };
            this.list.push(this.node);
        }

        if (chr === '\n') {
            // Convert newlines to spaces. Carriage return is ignored as \r and \n usually
            // go together anyway and there already is a WS for \n. Lone \r means something is fishy.
            chr = ' ';
        }

        if (chr.charCodeAt(0) >= 0x21 || [' ', '\t'].includes(chr)) {
            // skip command bytes
            this.node.value += chr;
        }

        this.escaped = false;
    }
}

/**
 * Maximum recursion depth for parsing nested groups.
 * RFC 5322 doesn't allow nested groups, so this is a safeguard against
 * malicious input that could cause stack overflow.
 */
const MAX_NESTED_GROUP_DEPTH = 50;

/**
 * Parses structured e-mail addresses from an address field
 *
 * Example:
 *
 *    'Name <address@domain>'
 *
 * will be converted to
 *
 *     [{name: 'Name', address: 'address@domain'}]
 *
 * @param {String} str Address field
 * @param {Object} options Optional options object
 * @param {Number} options._depth Internal recursion depth counter (do not set manually)
 * @return {Array} An array of address objects
 */
function addressParser(str, options) {
    options = options || {};
    let depth = options._depth || 0;

    // Prevent stack overflow from deeply nested groups (DoS protection)
    if (depth > MAX_NESTED_GROUP_DEPTH) {
        return [];
    }

    let tokenizer = new Tokenizer(str);
    let tokens = tokenizer.tokenize();

    let addresses = [];
    let address = [];
    let parsedAddresses = [];

    tokens.forEach(token => {
        if (token.type === 'operator' && (token.value === ',' || token.value === ';')) {
            if (address.length) {
                addresses.push(address);
            }
            address = [];
        } else {
            address.push(token);
        }
    });

    if (address.length) {
        addresses.push(address);
    }

    addresses.forEach(address => {
        address = _handleAddress(address, depth);
        if (address.length) {
            parsedAddresses = parsedAddresses.concat(address);
        }
    });

    if (options.flatten) {
        let addresses = [];
        let walkAddressList = list => {
            list.forEach(address => {
                if (address.group) {
                    return walkAddressList(address.group);
                } else {
                    addresses.push(address);
                }
            });
        };
        walkAddressList(parsedAddresses);
        return addresses;
    }

    return parsedAddresses;
}

// Code from: https://gist.githubusercontent.com/jonleighton/958841/raw/fb05a8632efb75d85d43deb593df04367ce48371/base64ArrayBuffer.js

// Converts an ArrayBuffer directly to base64, without any intermediate 'convert to string then
// use window.btoa' step. According to my tests, this appears to be a faster approach:
// http://jsperf.com/encoding-xhr-image-data/5

/*
MIT LICENSE

Copyright 2011 Jon Leighton

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

function base64ArrayBuffer(arrayBuffer) {
    var base64 = '';
    var encodings = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

    var bytes = new Uint8Array(arrayBuffer);
    var byteLength = bytes.byteLength;
    var byteRemainder = byteLength % 3;
    var mainLength = byteLength - byteRemainder;

    var a, b, c, d;
    var chunk;

    // Main loop deals with bytes in chunks of 3
    for (var i = 0; i < mainLength; i = i + 3) {
        // Combine the three bytes into a single integer
        chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];

        // Use bitmasks to extract 6-bit segments from the triplet
        a = (chunk & 16515072) >> 18; // 16515072 = (2^6 - 1) << 18
        b = (chunk & 258048) >> 12; // 258048   = (2^6 - 1) << 12
        c = (chunk & 4032) >> 6; // 4032     = (2^6 - 1) << 6
        d = chunk & 63; // 63       = 2^6 - 1

        // Convert the raw binary segments to the appropriate ASCII encoding
        base64 += encodings[a] + encodings[b] + encodings[c] + encodings[d];
    }

    // Deal with the remaining bytes and padding
    if (byteRemainder == 1) {
        chunk = bytes[mainLength];

        a = (chunk & 252) >> 2; // 252 = (2^6 - 1) << 2

        // Set the 4 least significant bits to zero
        b = (chunk & 3) << 4; // 3   = 2^2 - 1

        base64 += encodings[a] + encodings[b] + '==';
    } else if (byteRemainder == 2) {
        chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1];

        a = (chunk & 64512) >> 10; // 64512 = (2^6 - 1) << 10
        b = (chunk & 1008) >> 4; // 1008  = (2^6 - 1) << 4

        // Set the 2 least significant bits to zero
        c = (chunk & 15) << 2; // 15    = 2^4 - 1

        base64 += encodings[a] + encodings[b] + encodings[c] + '=';
    }

    return base64;
}

const MAX_NESTING_DEPTH = 256;
const MAX_HEADERS_SIZE = 2 * 1024 * 1024;

function toCamelCase(key) {
    return key.replace(/-(.)/g, (o, c) => c.toUpperCase());
}

class PostalMime {
    static parse(buf, options) {
        const parser = new PostalMime(options);
        return parser.parse(buf);
    }

    constructor(options) {
        this.options = options || {};
        this.mimeOptions = {
            maxNestingDepth: this.options.maxNestingDepth || MAX_NESTING_DEPTH,
            maxHeadersSize: this.options.maxHeadersSize || MAX_HEADERS_SIZE
        };

        this.root = this.currentNode = new MimeNode({
            postalMime: this,
            ...this.mimeOptions
        });
        this.boundaries = [];

        this.textContent = {};
        this.attachments = [];

        this.attachmentEncoding =
            (this.options.attachmentEncoding || '')
                .toString()
                .replace(/[-_\s]/g, '')
                .trim()
                .toLowerCase() || 'arraybuffer';

        this.started = false;
    }

    async finalize() {
        // close all pending nodes
        await this.root.finalize();
    }

    async processLine(line, isFinal) {
        let boundaries = this.boundaries;

        // check if this is a mime boundary
        if (boundaries.length && line.length > 2 && line[0] === 0x2d && line[1] === 0x2d) {
            // could be a boundary marker
            for (let i = boundaries.length - 1; i >= 0; i--) {
                let boundary = boundaries[i];

                // Line must be at least long enough for "--" + boundary
                if (line.length < boundary.value.length + 2) {
                    continue;
                }

                // Check if boundary value matches
                let boundaryMatches = true;
                for (let j = 0; j < boundary.value.length; j++) {
                    if (line[j + 2] !== boundary.value[j]) {
                        boundaryMatches = false;
                        break;
                    }
                }
                if (!boundaryMatches) {
                    continue;
                }

                // Check for terminator (-- after boundary) and determine where boundary ends
                let boundaryEnd = boundary.value.length + 2;
                let isTerminator = false;

                if (
                    line.length >= boundary.value.length + 4 &&
                    line[boundary.value.length + 2] === 0x2d &&
                    line[boundary.value.length + 3] === 0x2d
                ) {
                    isTerminator = true;
                    boundaryEnd = boundary.value.length + 4;
                }

                // RFC 2046: boundary line may have trailing whitespace (space/tab) before CRLF
                let hasValidTrailing = true;
                for (let j = boundaryEnd; j < line.length; j++) {
                    if (line[j] !== 0x20 && line[j] !== 0x09) {
                        hasValidTrailing = false;
                        break;
                    }
                }
                if (!hasValidTrailing) {
                    continue;
                }

                if (isTerminator) {
                    await boundary.node.finalize();

                    this.currentNode = boundary.node.parentNode || this.root;
                } else {
                    // finalize any open child nodes (should be just one though)
                    await boundary.node.finalizeChildNodes();

                    this.currentNode = new MimeNode({
                        postalMime: this,
                        parentNode: boundary.node,
                        parentMultipartType: boundary.node.contentType.multipart,
                        ...this.mimeOptions
                    });
                }

                if (isFinal) {
                    return this.finalize();
                }

                return;
            }
        }

        this.currentNode.feed(line);

        if (isFinal) {
            return this.finalize();
        }
    }

    readLine() {
        let startPos = this.readPos;
        let endPos = this.readPos;

        while (this.readPos < this.av.length) {
            const c = this.av[this.readPos++];

            if (c !== 0x0d && c !== 0x0a) {
                endPos = this.readPos;
            }

            if (c === 0x0a) {
                return {
                    bytes: new Uint8Array(this.buf, startPos, endPos - startPos),
                    done: this.readPos >= this.av.length
                };
            }
        }

        return {
            bytes: new Uint8Array(this.buf, startPos, endPos - startPos),
            done: this.readPos >= this.av.length
        };
    }

    async processNodeTree() {
        // get text nodes

        let textContent = {};

        let textTypes = new Set();
        let textMap = (this.textMap = new Map());

        let forceRfc822Attachments = this.forceRfc822Attachments();

        let walk = async (node, alternative, related) => {
            alternative = alternative || false;
            related = related || false;

            if (!node.contentType.multipart) {
                // is it inline message/rfc822
                if (this.isInlineMessageRfc822(node) && !forceRfc822Attachments) {
                    const subParser = new PostalMime();
                    node.subMessage = await subParser.parse(node.content);

                    if (!textMap.has(node)) {
                        textMap.set(node, {});
                    }

                    let textEntry = textMap.get(node);

                    // default to text if there is no content
                    if (node.subMessage.text || !node.subMessage.html) {
                        textEntry.plain = textEntry.plain || [];
                        textEntry.plain.push({ type: 'subMessage', value: node.subMessage });
                        textTypes.add('plain');
                    }

                    if (node.subMessage.html) {
                        textEntry.html = textEntry.html || [];
                        textEntry.html.push({ type: 'subMessage', value: node.subMessage });
                        textTypes.add('html');
                    }

                    if (subParser.textMap) {
                        subParser.textMap.forEach((subTextEntry, subTextNode) => {
                            textMap.set(subTextNode, subTextEntry);
                        });
                    }

                    for (let attachment of node.subMessage.attachments || []) {
                        this.attachments.push(attachment);
                    }
                }

                // is it text?
                else if (this.isInlineTextNode(node)) {
                    let textType = node.contentType.parsed.value.substr(node.contentType.parsed.value.indexOf('/') + 1);

                    let selectorNode = alternative || node;
                    if (!textMap.has(selectorNode)) {
                        textMap.set(selectorNode, {});
                    }

                    let textEntry = textMap.get(selectorNode);
                    textEntry[textType] = textEntry[textType] || [];
                    textEntry[textType].push({ type: 'text', value: node.getTextContent() });
                    textTypes.add(textType);
                }

                // is it an attachment
                else if (node.content) {
                    const filename =
                        node.contentDisposition?.parsed?.params?.filename ||
                        node.contentType.parsed.params.name ||
                        null;
                    const attachment = {
                        filename: filename ? decodeWords(filename) : null,
                        mimeType: node.contentType.parsed.value,
                        disposition: node.contentDisposition?.parsed?.value || null
                    };

                    if (related && node.contentId) {
                        attachment.related = true;
                    }

                    if (node.contentDescription) {
                        attachment.description = node.contentDescription;
                    }

                    if (node.contentId) {
                        attachment.contentId = node.contentId;
                    }

                    switch (node.contentType.parsed.value) {
                        // Special handling for calendar events
                        case 'text/calendar':
                        case 'application/ics': {
                            if (node.contentType.parsed.params.method) {
                                attachment.method = node.contentType.parsed.params.method
                                    .toString()
                                    .toUpperCase()
                                    .trim();
                            }

                            // Enforce into unicode
                            const decodedText = node.getTextContent().replace(/\r?\n/g, '\n').replace(/\n*$/, '\n');
                            attachment.content = textEncoder.encode(decodedText);
                            break;
                        }

                        // Regular attachments
                        default:
                            attachment.content = node.content;
                    }

                    this.attachments.push(attachment);
                }
            } else if (node.contentType.multipart === 'alternative') {
                alternative = node;
            } else if (node.contentType.multipart === 'related') {
                related = node;
            }

            for (let childNode of node.childNodes) {
                await walk(childNode, alternative, related);
            }
        };

        await walk(this.root, false, false);

        textMap.forEach(mapEntry => {
            textTypes.forEach(textType => {
                if (!textContent[textType]) {
                    textContent[textType] = [];
                }

                if (mapEntry[textType]) {
                    mapEntry[textType].forEach(textEntry => {
                        switch (textEntry.type) {
                            case 'text':
                                textContent[textType].push(textEntry.value);
                                break;

                            case 'subMessage':
                                {
                                    switch (textType) {
                                        case 'html':
                                            textContent[textType].push(formatHtmlHeader(textEntry.value));
                                            break;
                                        case 'plain':
                                            textContent[textType].push(formatTextHeader(textEntry.value));
                                            break;
                                    }
                                }
                                break;
                        }
                    });
                } else {
                    let alternativeType;
                    switch (textType) {
                        case 'html':
                            alternativeType = 'plain';
                            break;
                        case 'plain':
                            alternativeType = 'html';
                            break;
                    }

                    (mapEntry[alternativeType] || []).forEach(textEntry => {
                        switch (textEntry.type) {
                            case 'text':
                                switch (textType) {
                                    case 'html':
                                        textContent[textType].push(textToHtml(textEntry.value));
                                        break;
                                    case 'plain':
                                        textContent[textType].push(htmlToText(textEntry.value));
                                        break;
                                }
                                break;

                            case 'subMessage':
                                {
                                    switch (textType) {
                                        case 'html':
                                            textContent[textType].push(formatHtmlHeader(textEntry.value));
                                            break;
                                        case 'plain':
                                            textContent[textType].push(formatTextHeader(textEntry.value));
                                            break;
                                    }
                                }
                                break;
                        }
                    });
                }
            });
        });

        Object.keys(textContent).forEach(textType => {
            textContent[textType] = textContent[textType].join('\n');
        });

        this.textContent = textContent;
    }

    isInlineTextNode(node) {
        if (node.contentDisposition?.parsed?.value === 'attachment') {
            // no matter the type, this is an attachment
            return false;
        }

        switch (node.contentType.parsed?.value) {
            case 'text/html':
            case 'text/plain':
                return true;

            case 'text/calendar':
            case 'text/csv':
            default:
                return false;
        }
    }

    isInlineMessageRfc822(node) {
        if (node.contentType.parsed?.value !== 'message/rfc822') {
            return false;
        }
        let disposition =
            node.contentDisposition?.parsed?.value || (this.options.rfc822Attachments ? 'attachment' : 'inline');
        return disposition === 'inline';
    }

    // Check if this is a specially crafted report email where message/rfc822 content should not be inlined
    forceRfc822Attachments() {
        if (this.options.forceRfc822Attachments) {
            return true;
        }

        let forceRfc822Attachments = false;
        let walk = node => {
            if (!node.contentType.multipart) {
                if (
                    node.contentType.parsed &&
                    ['message/delivery-status', 'message/feedback-report'].includes(node.contentType.parsed.value)
                ) {
                    forceRfc822Attachments = true;
                }
            }

            for (let childNode of node.childNodes) {
                walk(childNode);
            }
        };
        walk(this.root);
        return forceRfc822Attachments;
    }

    async resolveStream(stream) {
        let chunkLen = 0;
        let chunks = [];
        const reader = stream.getReader();

        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                break;
            }
            chunks.push(value);
            chunkLen += value.length;
        }

        const result = new Uint8Array(chunkLen);
        let chunkPointer = 0;
        for (let chunk of chunks) {
            result.set(chunk, chunkPointer);
            chunkPointer += chunk.length;
        }

        return result;
    }

    async parse(buf) {
        if (this.started) {
            throw new Error('Can not reuse parser, create a new PostalMime object');
        }
        this.started = true;

        // Check if the input is a readable stream and resolve it into an ArrayBuffer
        if (buf && typeof buf.getReader === 'function') {
            buf = await this.resolveStream(buf);
        }

        // Should it throw for an empty value instead of defaulting to an empty ArrayBuffer?
        buf = buf || new ArrayBuffer(0);

        // Cast string input to Uint8Array
        if (typeof buf === 'string') {
            buf = textEncoder.encode(buf);
        }

        // Cast Blob to ArrayBuffer
        if (buf instanceof Blob || Object.prototype.toString.call(buf) === '[object Blob]') {
            buf = await blobToArrayBuffer(buf);
        }

        // Cast Node.js Buffer object or Uint8Array into ArrayBuffer
        if (buf.buffer instanceof ArrayBuffer) {
            buf = new Uint8Array(buf).buffer;
        }

        this.buf = buf;

        this.av = new Uint8Array(buf);
        this.readPos = 0;

        while (this.readPos < this.av.length) {
            const line = this.readLine();

            await this.processLine(line.bytes, line.done);
        }

        await this.processNodeTree();

        const message = {
            headers: this.root.headers
                .map(entry => ({ key: entry.key, originalKey: entry.originalKey, value: entry.value }))
                .reverse()
        };

        for (const key of ['from', 'sender']) {
            const addressHeader = this.root.headers.find(line => line.key === key);
            if (addressHeader && addressHeader.value) {
                const addresses = addressParser(addressHeader.value);
                if (addresses && addresses.length) {
                    message[key] = addresses[0];
                }
            }
        }

        for (const key of ['delivered-to', 'return-path']) {
            const addressHeader = this.root.headers.find(line => line.key === key);
            if (addressHeader && addressHeader.value) {
                const addresses = addressParser(addressHeader.value);
                if (addresses && addresses.length && addresses[0].address) {
                    const camelKey = toCamelCase(key);
                    message[camelKey] = addresses[0].address;
                }
            }
        }

        for (const key of ['to', 'cc', 'bcc', 'reply-to']) {
            const addressHeaders = this.root.headers.filter(line => line.key === key);
            let addresses = [];

            addressHeaders
                .filter(entry => entry && entry.value)
                .map(entry => addressParser(entry.value))
                .forEach(parsed => (addresses = addresses.concat(parsed || [])));

            if (addresses && addresses.length) {
                const camelKey = toCamelCase(key);
                message[camelKey] = addresses;
            }
        }

        for (const key of ['subject', 'message-id', 'in-reply-to', 'references']) {
            const header = this.root.headers.find(line => line.key === key);
            if (header && header.value) {
                const camelKey = toCamelCase(key);
                message[camelKey] = decodeWords(header.value);
            }
        }

        let dateHeader = this.root.headers.find(line => line.key === 'date');
        if (dateHeader) {
            let date = new Date(dateHeader.value);
            if (date.toString() === 'Invalid Date') {
                date = dateHeader.value;
            } else {
                // enforce ISO format if seems to be a valid date
                date = date.toISOString();
            }
            message.date = date;
        }

        if (this.textContent?.html) {
            message.html = this.textContent.html;
        }

        if (this.textContent?.plain) {
            message.text = this.textContent.plain;
        }

        message.attachments = this.attachments;

        // Expose raw header lines (reversed to match headers array order)
        message.headerLines = (this.root.rawHeaderLines || []).slice().reverse();

        switch (this.attachmentEncoding) {
            case 'arraybuffer':
                break;

            case 'base64':
                for (let attachment of message.attachments || []) {
                    if (attachment?.content) {
                        attachment.content = base64ArrayBuffer(attachment.content);
                        attachment.encoding = 'base64';
                    }
                }
                break;

            case 'utf8':
                let attachmentDecoder = new TextDecoder('utf8');
                for (let attachment of message.attachments || []) {
                    if (attachment?.content) {
                        attachment.content = attachmentDecoder.decode(attachment.content);
                        attachment.encoding = 'utf8';
                    }
                }
                break;

            default:
                throw new Error('Unknown attachment encoding');
        }

        return message;
    }
}

var dist$1 = {};

var application = {};

var applicationIn = {};

var hasRequiredApplicationIn;

function requireApplicationIn () {
	if (hasRequiredApplicationIn) return applicationIn;
	hasRequiredApplicationIn = 1;
	Object.defineProperty(applicationIn, "__esModule", { value: true });
	applicationIn.ApplicationInSerializer = void 0;
	applicationIn.ApplicationInSerializer = {
	    _fromJsonObject(object) {
	        return {
	            metadata: object["metadata"],
	            name: object["name"],
	            rateLimit: object["rateLimit"],
	            throttleRate: object["throttleRate"],
	            uid: object["uid"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            metadata: self.metadata,
	            name: self.name,
	            rateLimit: self.rateLimit,
	            throttleRate: self.throttleRate,
	            uid: self.uid,
	        };
	    },
	};
	
	return applicationIn;
}

var applicationOut = {};

var hasRequiredApplicationOut;

function requireApplicationOut () {
	if (hasRequiredApplicationOut) return applicationOut;
	hasRequiredApplicationOut = 1;
	Object.defineProperty(applicationOut, "__esModule", { value: true });
	applicationOut.ApplicationOutSerializer = void 0;
	applicationOut.ApplicationOutSerializer = {
	    _fromJsonObject(object) {
	        return {
	            createdAt: new Date(object["createdAt"]),
	            id: object["id"],
	            metadata: object["metadata"],
	            name: object["name"],
	            rateLimit: object["rateLimit"],
	            throttleRate: object["throttleRate"],
	            uid: object["uid"],
	            updatedAt: new Date(object["updatedAt"]),
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            createdAt: self.createdAt,
	            id: self.id,
	            metadata: self.metadata,
	            name: self.name,
	            rateLimit: self.rateLimit,
	            throttleRate: self.throttleRate,
	            uid: self.uid,
	            updatedAt: self.updatedAt,
	        };
	    },
	};
	
	return applicationOut;
}

var applicationPatch = {};

var hasRequiredApplicationPatch;

function requireApplicationPatch () {
	if (hasRequiredApplicationPatch) return applicationPatch;
	hasRequiredApplicationPatch = 1;
	Object.defineProperty(applicationPatch, "__esModule", { value: true });
	applicationPatch.ApplicationPatchSerializer = void 0;
	applicationPatch.ApplicationPatchSerializer = {
	    _fromJsonObject(object) {
	        return {
	            metadata: object["metadata"],
	            name: object["name"],
	            rateLimit: object["rateLimit"],
	            uid: object["uid"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            metadata: self.metadata,
	            name: self.name,
	            rateLimit: self.rateLimit,
	            uid: self.uid,
	        };
	    },
	};
	
	return applicationPatch;
}

var listResponseApplicationOut = {};

var hasRequiredListResponseApplicationOut;

function requireListResponseApplicationOut () {
	if (hasRequiredListResponseApplicationOut) return listResponseApplicationOut;
	hasRequiredListResponseApplicationOut = 1;
	Object.defineProperty(listResponseApplicationOut, "__esModule", { value: true });
	listResponseApplicationOut.ListResponseApplicationOutSerializer = void 0;
	const applicationOut_1 = requireApplicationOut();
	listResponseApplicationOut.ListResponseApplicationOutSerializer = {
	    _fromJsonObject(object) {
	        return {
	            data: object["data"].map((item) => applicationOut_1.ApplicationOutSerializer._fromJsonObject(item)),
	            done: object["done"],
	            iterator: object["iterator"],
	            prevIterator: object["prevIterator"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            data: self.data.map((item) => applicationOut_1.ApplicationOutSerializer._toJsonObject(item)),
	            done: self.done,
	            iterator: self.iterator,
	            prevIterator: self.prevIterator,
	        };
	    },
	};
	
	return listResponseApplicationOut;
}

var request = {};

var util = {};

var hasRequiredUtil;

function requireUtil () {
	if (hasRequiredUtil) return util;
	hasRequiredUtil = 1;
	Object.defineProperty(util, "__esModule", { value: true });
	util.ApiException = void 0;
	class ApiException extends Error {
	    constructor(code, body, headers) {
	        super(`HTTP-Code: ${code}\nHeaders: ${JSON.stringify(headers)}`);
	        this.code = code;
	        this.body = body;
	        this.headers = {};
	        headers.forEach((value, name) => {
	            this.headers[name] = value;
	        });
	    }
	}
	util.ApiException = ApiException;
	
	return util;
}

var commonjsBrowser = {};

var max = {};

var hasRequiredMax;

function requireMax () {
	if (hasRequiredMax) return max;
	hasRequiredMax = 1;

	Object.defineProperty(max, "__esModule", {
	  value: true
	});
	max.default = void 0;
	max.default = 'ffffffff-ffff-ffff-ffff-ffffffffffff';
	return max;
}

var nil = {};

var hasRequiredNil;

function requireNil () {
	if (hasRequiredNil) return nil;
	hasRequiredNil = 1;

	Object.defineProperty(nil, "__esModule", {
	  value: true
	});
	nil.default = void 0;
	nil.default = '00000000-0000-0000-0000-000000000000';
	return nil;
}

var parse = {};

var validate = {};

var regex = {};

var hasRequiredRegex;

function requireRegex () {
	if (hasRequiredRegex) return regex;
	hasRequiredRegex = 1;

	Object.defineProperty(regex, "__esModule", {
	  value: true
	});
	regex.default = void 0;
	regex.default = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/i;
	return regex;
}

var hasRequiredValidate;

function requireValidate () {
	if (hasRequiredValidate) return validate;
	hasRequiredValidate = 1;

	Object.defineProperty(validate, "__esModule", {
	  value: true
	});
	validate.default = void 0;
	var _regex = _interopRequireDefault(/*@__PURE__*/ requireRegex());
	function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
	function validate$1(uuid) {
	  return typeof uuid === 'string' && _regex.default.test(uuid);
	}
	validate.default = validate$1;
	return validate;
}

var hasRequiredParse;

function requireParse () {
	if (hasRequiredParse) return parse;
	hasRequiredParse = 1;

	Object.defineProperty(parse, "__esModule", {
	  value: true
	});
	parse.default = void 0;
	var _validate = _interopRequireDefault(/*@__PURE__*/ requireValidate());
	function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
	function parse$1(uuid) {
	  if (!(0, _validate.default)(uuid)) {
	    throw TypeError('Invalid UUID');
	  }
	  var v;
	  var arr = new Uint8Array(16);

	  // Parse ########-....-....-....-............
	  arr[0] = (v = parseInt(uuid.slice(0, 8), 16)) >>> 24;
	  arr[1] = v >>> 16 & 0xff;
	  arr[2] = v >>> 8 & 0xff;
	  arr[3] = v & 0xff;

	  // Parse ........-####-....-....-............
	  arr[4] = (v = parseInt(uuid.slice(9, 13), 16)) >>> 8;
	  arr[5] = v & 0xff;

	  // Parse ........-....-####-....-............
	  arr[6] = (v = parseInt(uuid.slice(14, 18), 16)) >>> 8;
	  arr[7] = v & 0xff;

	  // Parse ........-....-....-####-............
	  arr[8] = (v = parseInt(uuid.slice(19, 23), 16)) >>> 8;
	  arr[9] = v & 0xff;

	  // Parse ........-....-....-....-############
	  // (Use "/" to avoid 32-bit truncation when bit-shifting high-order bytes)
	  arr[10] = (v = parseInt(uuid.slice(24, 36), 16)) / 0x10000000000 & 0xff;
	  arr[11] = v / 0x100000000 & 0xff;
	  arr[12] = v >>> 24 & 0xff;
	  arr[13] = v >>> 16 & 0xff;
	  arr[14] = v >>> 8 & 0xff;
	  arr[15] = v & 0xff;
	  return arr;
	}
	parse.default = parse$1;
	return parse;
}

var stringify = {};

var hasRequiredStringify;

function requireStringify () {
	if (hasRequiredStringify) return stringify;
	hasRequiredStringify = 1;

	Object.defineProperty(stringify, "__esModule", {
	  value: true
	});
	stringify.default = void 0;
	stringify.unsafeStringify = unsafeStringify;
	var _validate = _interopRequireDefault(/*@__PURE__*/ requireValidate());
	function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
	/**
	 * Convert array of 16 byte values to UUID string format of the form:
	 * XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
	 */
	var byteToHex = [];
	for (var i = 0; i < 256; ++i) {
	  byteToHex.push((i + 0x100).toString(16).slice(1));
	}
	function unsafeStringify(arr, offset = 0) {
	  // Note: Be careful editing this code!  It's been tuned for performance
	  // and works in ways you may not expect. See https://github.com/uuidjs/uuid/pull/434
	  //
	  // Note to future-self: No, you can't remove the `toLowerCase()` call.
	  // REF: https://github.com/uuidjs/uuid/pull/677#issuecomment-1757351351
	  return (byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + '-' + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + '-' + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + '-' + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + '-' + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]]).toLowerCase();
	}
	function stringify$1(arr, offset = 0) {
	  var uuid = unsafeStringify(arr, offset);
	  // Consistency check for valid UUID.  If this throws, it's likely due to one
	  // of the following:
	  // - One or more input array values don't map to a hex octet (leading to
	  // "undefined" in the uuid)
	  // - Invalid input values for the RFC `version` or `variant` fields
	  if (!(0, _validate.default)(uuid)) {
	    throw TypeError('Stringified UUID is invalid');
	  }
	  return uuid;
	}
	stringify.default = stringify$1;
	return stringify;
}

var v1 = {};

var rng = {};

var hasRequiredRng;

function requireRng () {
	if (hasRequiredRng) return rng;
	hasRequiredRng = 1;

	Object.defineProperty(rng, "__esModule", {
	  value: true
	});
	rng.default = rng$1;
	// Unique ID creation requires a high quality random # generator. In the browser we therefore
	// require the crypto API and do not support built-in fallback to lower quality random number
	// generators (like Math.random()).

	var getRandomValues;
	var rnds8 = new Uint8Array(16);
	function rng$1() {
	  // lazy load so that environments that need to polyfill have a chance to do so
	  if (!getRandomValues) {
	    // getRandomValues needs to be invoked in a context where "this" is a Crypto implementation.
	    getRandomValues = typeof crypto !== 'undefined' && crypto.getRandomValues && crypto.getRandomValues.bind(crypto);
	    if (!getRandomValues) {
	      throw new Error('crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported');
	    }
	  }
	  return getRandomValues(rnds8);
	}
	return rng;
}

var hasRequiredV1;

function requireV1 () {
	if (hasRequiredV1) return v1;
	hasRequiredV1 = 1;

	Object.defineProperty(v1, "__esModule", {
	  value: true
	});
	v1.default = void 0;
	var _rng = _interopRequireDefault(/*@__PURE__*/ requireRng());
	var _stringify = /*@__PURE__*/ requireStringify();
	function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
	// **`v1()` - Generate time-based UUID**
	//
	// Inspired by https://github.com/LiosK/UUID.js
	// and http://docs.python.org/library/uuid.html

	var _nodeId;
	var _clockseq;

	// Previous uuid creation time
	var _lastMSecs = 0;
	var _lastNSecs = 0;

	// See https://github.com/uuidjs/uuid for API details
	function v1$1(options, buf, offset) {
	  var i = buf && offset || 0;
	  var b = buf || new Array(16);
	  options = options || {};
	  var node = options.node;
	  var clockseq = options.clockseq;

	  // v1 only: Use cached `node` and `clockseq` values
	  if (!options._v6) {
	    if (!node) {
	      node = _nodeId;
	    }
	    if (clockseq == null) {
	      clockseq = _clockseq;
	    }
	  }

	  // Handle cases where we need entropy.  We do this lazily to minimize issues
	  // related to insufficient system entropy.  See #189
	  if (node == null || clockseq == null) {
	    var seedBytes = options.random || (options.rng || _rng.default)();

	    // Randomize node
	    if (node == null) {
	      node = [seedBytes[0], seedBytes[1], seedBytes[2], seedBytes[3], seedBytes[4], seedBytes[5]];

	      // v1 only: cache node value for reuse
	      if (!_nodeId && !options._v6) {
	        // per RFC4122 4.5: Set MAC multicast bit (v1 only)
	        node[0] |= 0x01; // Set multicast bit

	        _nodeId = node;
	      }
	    }

	    // Randomize clockseq
	    if (clockseq == null) {
	      // Per 4.2.2, randomize (14 bit) clockseq
	      clockseq = (seedBytes[6] << 8 | seedBytes[7]) & 0x3fff;
	      if (_clockseq === undefined && !options._v6) {
	        _clockseq = clockseq;
	      }
	    }
	  }

	  // v1 & v6 timestamps are 100 nano-second units since the Gregorian epoch,
	  // (1582-10-15 00:00).  JSNumbers aren't precise enough for this, so time is
	  // handled internally as 'msecs' (integer milliseconds) and 'nsecs'
	  // (100-nanoseconds offset from msecs) since unix epoch, 1970-01-01 00:00.
	  var msecs = options.msecs !== undefined ? options.msecs : Date.now();

	  // Per 4.2.1.2, use count of uuid's generated during the current clock
	  // cycle to simulate higher resolution clock
	  var nsecs = options.nsecs !== undefined ? options.nsecs : _lastNSecs + 1;

	  // Time since last uuid creation (in msecs)
	  var dt = msecs - _lastMSecs + (nsecs - _lastNSecs) / 10000;

	  // Per 4.2.1.2, Bump clockseq on clock regression
	  if (dt < 0 && options.clockseq === undefined) {
	    clockseq = clockseq + 1 & 0x3fff;
	  }

	  // Reset nsecs if clock regresses (new clockseq) or we've moved onto a new
	  // time interval
	  if ((dt < 0 || msecs > _lastMSecs) && options.nsecs === undefined) {
	    nsecs = 0;
	  }

	  // Per 4.2.1.2 Throw error if too many uuids are requested
	  if (nsecs >= 10000) {
	    throw new Error("uuid.v1(): Can't create more than 10M uuids/sec");
	  }
	  _lastMSecs = msecs;
	  _lastNSecs = nsecs;
	  _clockseq = clockseq;

	  // Per 4.1.4 - Convert from unix epoch to Gregorian epoch
	  msecs += 12219292800000;

	  // `time_low`
	  var tl = ((msecs & 0xfffffff) * 10000 + nsecs) % 0x100000000;
	  b[i++] = tl >>> 24 & 0xff;
	  b[i++] = tl >>> 16 & 0xff;
	  b[i++] = tl >>> 8 & 0xff;
	  b[i++] = tl & 0xff;

	  // `time_mid`
	  var tmh = msecs / 0x100000000 * 10000 & 0xfffffff;
	  b[i++] = tmh >>> 8 & 0xff;
	  b[i++] = tmh & 0xff;

	  // `time_high_and_version`
	  b[i++] = tmh >>> 24 & 0xf | 0x10; // include version
	  b[i++] = tmh >>> 16 & 0xff;

	  // `clock_seq_hi_and_reserved` (Per 4.2.2 - include variant)
	  b[i++] = clockseq >>> 8 | 0x80;

	  // `clock_seq_low`
	  b[i++] = clockseq & 0xff;

	  // `node`
	  for (var n = 0; n < 6; ++n) {
	    b[i + n] = node[n];
	  }
	  return buf || (0, _stringify.unsafeStringify)(b);
	}
	v1.default = v1$1;
	return v1;
}

var v1ToV6 = {};

var hasRequiredV1ToV6;

function requireV1ToV6 () {
	if (hasRequiredV1ToV6) return v1ToV6;
	hasRequiredV1ToV6 = 1;

	Object.defineProperty(v1ToV6, "__esModule", {
	  value: true
	});
	v1ToV6.default = v1ToV6$1;
	var _parse = _interopRequireDefault(/*@__PURE__*/ requireParse());
	var _stringify = /*@__PURE__*/ requireStringify();
	function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
	/**
	 * Convert a v1 UUID to a v6 UUID
	 *
	 * @param {string|Uint8Array} uuid - The v1 UUID to convert to v6
	 * @returns {string|Uint8Array} The v6 UUID as the same type as the `uuid` arg
	 * (string or Uint8Array)
	 */
	function v1ToV6$1(uuid) {
	  var v1Bytes = typeof uuid === 'string' ? (0, _parse.default)(uuid) : uuid;
	  var v6Bytes = _v1ToV6(v1Bytes);
	  return typeof uuid === 'string' ? (0, _stringify.unsafeStringify)(v6Bytes) : v6Bytes;
	}

	// Do the field transformation needed for v1 -> v6
	function _v1ToV6(v1Bytes, randomize = false) {
	  return Uint8Array.of((v1Bytes[6] & 0x0f) << 4 | v1Bytes[7] >> 4 & 0x0f, (v1Bytes[7] & 0x0f) << 4 | (v1Bytes[4] & 0xf0) >> 4, (v1Bytes[4] & 0x0f) << 4 | (v1Bytes[5] & 0xf0) >> 4, (v1Bytes[5] & 0x0f) << 4 | (v1Bytes[0] & 0xf0) >> 4, (v1Bytes[0] & 0x0f) << 4 | (v1Bytes[1] & 0xf0) >> 4, (v1Bytes[1] & 0x0f) << 4 | (v1Bytes[2] & 0xf0) >> 4, 0x60 | v1Bytes[2] & 0x0f, v1Bytes[3], v1Bytes[8], v1Bytes[9], v1Bytes[10], v1Bytes[11], v1Bytes[12], v1Bytes[13], v1Bytes[14], v1Bytes[15]);
	}
	return v1ToV6;
}

var v3 = {};

var v35 = {};

var hasRequiredV35;

function requireV35 () {
	if (hasRequiredV35) return v35;
	hasRequiredV35 = 1;

	Object.defineProperty(v35, "__esModule", {
	  value: true
	});
	v35.URL = v35.DNS = void 0;
	v35.default = v35$1;
	var _stringify = /*@__PURE__*/ requireStringify();
	var _parse = _interopRequireDefault(/*@__PURE__*/ requireParse());
	function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
	function stringToBytes(str) {
	  str = unescape(encodeURIComponent(str)); // UTF8 escape

	  var bytes = [];
	  for (var i = 0; i < str.length; ++i) {
	    bytes.push(str.charCodeAt(i));
	  }
	  return bytes;
	}
	var DNS = v35.DNS = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
	var URL = v35.URL = '6ba7b811-9dad-11d1-80b4-00c04fd430c8';
	function v35$1(name, version, hashfunc) {
	  function generateUUID(value, namespace, buf, offset) {
	    var _namespace;
	    if (typeof value === 'string') {
	      value = stringToBytes(value);
	    }
	    if (typeof namespace === 'string') {
	      namespace = (0, _parse.default)(namespace);
	    }
	    if (((_namespace = namespace) === null || _namespace === void 0 ? void 0 : _namespace.length) !== 16) {
	      throw TypeError('Namespace must be array-like (16 iterable integer values, 0-255)');
	    }

	    // Compute hash of namespace and value, Per 4.3
	    // Future: Use spread syntax when supported on all platforms, e.g. `bytes =
	    // hashfunc([...namespace, ... value])`
	    var bytes = new Uint8Array(16 + value.length);
	    bytes.set(namespace);
	    bytes.set(value, namespace.length);
	    bytes = hashfunc(bytes);
	    bytes[6] = bytes[6] & 0x0f | version;
	    bytes[8] = bytes[8] & 0x3f | 0x80;
	    if (buf) {
	      offset = offset || 0;
	      for (var i = 0; i < 16; ++i) {
	        buf[offset + i] = bytes[i];
	      }
	      return buf;
	    }
	    return (0, _stringify.unsafeStringify)(bytes);
	  }

	  // Function#name is not settable on some platforms (#270)
	  try {
	    generateUUID.name = name;
	  } catch (err) {}

	  // For CommonJS default export support
	  generateUUID.DNS = DNS;
	  generateUUID.URL = URL;
	  return generateUUID;
	}
	return v35;
}

var md5 = {};

var hasRequiredMd5;

function requireMd5 () {
	if (hasRequiredMd5) return md5;
	hasRequiredMd5 = 1;

	Object.defineProperty(md5, "__esModule", {
	  value: true
	});
	md5.default = void 0;
	/*
	 * Browser-compatible JavaScript MD5
	 *
	 * Modification of JavaScript MD5
	 * https://github.com/blueimp/JavaScript-MD5
	 *
	 * Copyright 2011, Sebastian Tschan
	 * https://blueimp.net
	 *
	 * Licensed under the MIT license:
	 * https://opensource.org/licenses/MIT
	 *
	 * Based on
	 * A JavaScript implementation of the RSA Data Security, Inc. MD5 Message
	 * Digest Algorithm, as defined in RFC 1321.
	 * Version 2.2 Copyright (C) Paul Johnston 1999 - 2009
	 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
	 * Distributed under the BSD License
	 * See http://pajhome.org.uk/crypt/md5 for more info.
	 */
	function md5$1(bytes) {
	  if (typeof bytes === 'string') {
	    var msg = unescape(encodeURIComponent(bytes)); // UTF8 escape

	    bytes = new Uint8Array(msg.length);
	    for (var i = 0; i < msg.length; ++i) {
	      bytes[i] = msg.charCodeAt(i);
	    }
	  }
	  return md5ToHexEncodedArray(wordsToMd5(bytesToWords(bytes), bytes.length * 8));
	}

	/*
	 * Convert an array of little-endian words to an array of bytes
	 */
	function md5ToHexEncodedArray(input) {
	  var output = [];
	  var length32 = input.length * 32;
	  var hexTab = '0123456789abcdef';
	  for (var i = 0; i < length32; i += 8) {
	    var x = input[i >> 5] >>> i % 32 & 0xff;
	    var hex = parseInt(hexTab.charAt(x >>> 4 & 0x0f) + hexTab.charAt(x & 0x0f), 16);
	    output.push(hex);
	  }
	  return output;
	}

	/**
	 * Calculate output length with padding and bit length
	 */
	function getOutputLength(inputLength8) {
	  return (inputLength8 + 64 >>> 9 << 4) + 14 + 1;
	}

	/*
	 * Calculate the MD5 of an array of little-endian words, and a bit length.
	 */
	function wordsToMd5(x, len) {
	  /* append padding */
	  x[len >> 5] |= 0x80 << len % 32;
	  x[getOutputLength(len) - 1] = len;
	  var a = 1732584193;
	  var b = -271733879;
	  var c = -1732584194;
	  var d = 271733878;
	  for (var i = 0; i < x.length; i += 16) {
	    var olda = a;
	    var oldb = b;
	    var oldc = c;
	    var oldd = d;
	    a = md5ff(a, b, c, d, x[i], 7, -680876936);
	    d = md5ff(d, a, b, c, x[i + 1], 12, -389564586);
	    c = md5ff(c, d, a, b, x[i + 2], 17, 606105819);
	    b = md5ff(b, c, d, a, x[i + 3], 22, -1044525330);
	    a = md5ff(a, b, c, d, x[i + 4], 7, -176418897);
	    d = md5ff(d, a, b, c, x[i + 5], 12, 1200080426);
	    c = md5ff(c, d, a, b, x[i + 6], 17, -1473231341);
	    b = md5ff(b, c, d, a, x[i + 7], 22, -45705983);
	    a = md5ff(a, b, c, d, x[i + 8], 7, 1770035416);
	    d = md5ff(d, a, b, c, x[i + 9], 12, -1958414417);
	    c = md5ff(c, d, a, b, x[i + 10], 17, -42063);
	    b = md5ff(b, c, d, a, x[i + 11], 22, -1990404162);
	    a = md5ff(a, b, c, d, x[i + 12], 7, 1804603682);
	    d = md5ff(d, a, b, c, x[i + 13], 12, -40341101);
	    c = md5ff(c, d, a, b, x[i + 14], 17, -1502002290);
	    b = md5ff(b, c, d, a, x[i + 15], 22, 1236535329);
	    a = md5gg(a, b, c, d, x[i + 1], 5, -165796510);
	    d = md5gg(d, a, b, c, x[i + 6], 9, -1069501632);
	    c = md5gg(c, d, a, b, x[i + 11], 14, 643717713);
	    b = md5gg(b, c, d, a, x[i], 20, -373897302);
	    a = md5gg(a, b, c, d, x[i + 5], 5, -701558691);
	    d = md5gg(d, a, b, c, x[i + 10], 9, 38016083);
	    c = md5gg(c, d, a, b, x[i + 15], 14, -660478335);
	    b = md5gg(b, c, d, a, x[i + 4], 20, -405537848);
	    a = md5gg(a, b, c, d, x[i + 9], 5, 568446438);
	    d = md5gg(d, a, b, c, x[i + 14], 9, -1019803690);
	    c = md5gg(c, d, a, b, x[i + 3], 14, -187363961);
	    b = md5gg(b, c, d, a, x[i + 8], 20, 1163531501);
	    a = md5gg(a, b, c, d, x[i + 13], 5, -1444681467);
	    d = md5gg(d, a, b, c, x[i + 2], 9, -51403784);
	    c = md5gg(c, d, a, b, x[i + 7], 14, 1735328473);
	    b = md5gg(b, c, d, a, x[i + 12], 20, -1926607734);
	    a = md5hh(a, b, c, d, x[i + 5], 4, -378558);
	    d = md5hh(d, a, b, c, x[i + 8], 11, -2022574463);
	    c = md5hh(c, d, a, b, x[i + 11], 16, 1839030562);
	    b = md5hh(b, c, d, a, x[i + 14], 23, -35309556);
	    a = md5hh(a, b, c, d, x[i + 1], 4, -1530992060);
	    d = md5hh(d, a, b, c, x[i + 4], 11, 1272893353);
	    c = md5hh(c, d, a, b, x[i + 7], 16, -155497632);
	    b = md5hh(b, c, d, a, x[i + 10], 23, -1094730640);
	    a = md5hh(a, b, c, d, x[i + 13], 4, 681279174);
	    d = md5hh(d, a, b, c, x[i], 11, -358537222);
	    c = md5hh(c, d, a, b, x[i + 3], 16, -722521979);
	    b = md5hh(b, c, d, a, x[i + 6], 23, 76029189);
	    a = md5hh(a, b, c, d, x[i + 9], 4, -640364487);
	    d = md5hh(d, a, b, c, x[i + 12], 11, -421815835);
	    c = md5hh(c, d, a, b, x[i + 15], 16, 530742520);
	    b = md5hh(b, c, d, a, x[i + 2], 23, -995338651);
	    a = md5ii(a, b, c, d, x[i], 6, -198630844);
	    d = md5ii(d, a, b, c, x[i + 7], 10, 1126891415);
	    c = md5ii(c, d, a, b, x[i + 14], 15, -1416354905);
	    b = md5ii(b, c, d, a, x[i + 5], 21, -57434055);
	    a = md5ii(a, b, c, d, x[i + 12], 6, 1700485571);
	    d = md5ii(d, a, b, c, x[i + 3], 10, -1894986606);
	    c = md5ii(c, d, a, b, x[i + 10], 15, -1051523);
	    b = md5ii(b, c, d, a, x[i + 1], 21, -2054922799);
	    a = md5ii(a, b, c, d, x[i + 8], 6, 1873313359);
	    d = md5ii(d, a, b, c, x[i + 15], 10, -30611744);
	    c = md5ii(c, d, a, b, x[i + 6], 15, -1560198380);
	    b = md5ii(b, c, d, a, x[i + 13], 21, 1309151649);
	    a = md5ii(a, b, c, d, x[i + 4], 6, -145523070);
	    d = md5ii(d, a, b, c, x[i + 11], 10, -1120210379);
	    c = md5ii(c, d, a, b, x[i + 2], 15, 718787259);
	    b = md5ii(b, c, d, a, x[i + 9], 21, -343485551);
	    a = safeAdd(a, olda);
	    b = safeAdd(b, oldb);
	    c = safeAdd(c, oldc);
	    d = safeAdd(d, oldd);
	  }
	  return [a, b, c, d];
	}

	/*
	 * Convert an array bytes to an array of little-endian words
	 * Characters >255 have their high-byte silently ignored.
	 */
	function bytesToWords(input) {
	  if (input.length === 0) {
	    return [];
	  }
	  var length8 = input.length * 8;
	  var output = new Uint32Array(getOutputLength(length8));
	  for (var i = 0; i < length8; i += 8) {
	    output[i >> 5] |= (input[i / 8] & 0xff) << i % 32;
	  }
	  return output;
	}

	/*
	 * Add integers, wrapping at 2^32. This uses 16-bit operations internally
	 * to work around bugs in some JS interpreters.
	 */
	function safeAdd(x, y) {
	  var lsw = (x & 0xffff) + (y & 0xffff);
	  var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
	  return msw << 16 | lsw & 0xffff;
	}

	/*
	 * Bitwise rotate a 32-bit number to the left.
	 */
	function bitRotateLeft(num, cnt) {
	  return num << cnt | num >>> 32 - cnt;
	}

	/*
	 * These functions implement the four basic operations the algorithm uses.
	 */
	function md5cmn(q, a, b, x, s, t) {
	  return safeAdd(bitRotateLeft(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b);
	}
	function md5ff(a, b, c, d, x, s, t) {
	  return md5cmn(b & c | ~b & d, a, b, x, s, t);
	}
	function md5gg(a, b, c, d, x, s, t) {
	  return md5cmn(b & d | c & ~d, a, b, x, s, t);
	}
	function md5hh(a, b, c, d, x, s, t) {
	  return md5cmn(b ^ c ^ d, a, b, x, s, t);
	}
	function md5ii(a, b, c, d, x, s, t) {
	  return md5cmn(c ^ (b | ~d), a, b, x, s, t);
	}
	md5.default = md5$1;
	return md5;
}

var hasRequiredV3;

function requireV3 () {
	if (hasRequiredV3) return v3;
	hasRequiredV3 = 1;

	Object.defineProperty(v3, "__esModule", {
	  value: true
	});
	v3.default = void 0;
	var _v = _interopRequireDefault(/*@__PURE__*/ requireV35());
	var _md = _interopRequireDefault(/*@__PURE__*/ requireMd5());
	function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
	var v3$1 = (0, _v.default)('v3', 0x30, _md.default);
	v3.default = v3$1;
	return v3;
}

var v4 = {};

var native = {};

var hasRequiredNative;

function requireNative () {
	if (hasRequiredNative) return native;
	hasRequiredNative = 1;

	Object.defineProperty(native, "__esModule", {
	  value: true
	});
	native.default = void 0;
	var randomUUID = typeof crypto !== 'undefined' && crypto.randomUUID && crypto.randomUUID.bind(crypto);
	native.default = {
	  randomUUID
	};
	return native;
}

var hasRequiredV4;

function requireV4 () {
	if (hasRequiredV4) return v4;
	hasRequiredV4 = 1;

	Object.defineProperty(v4, "__esModule", {
	  value: true
	});
	v4.default = void 0;
	var _native = _interopRequireDefault(/*@__PURE__*/ requireNative());
	var _rng = _interopRequireDefault(/*@__PURE__*/ requireRng());
	var _stringify = /*@__PURE__*/ requireStringify();
	function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
	function v4$1(options, buf, offset) {
	  if (_native.default.randomUUID && !buf && !options) {
	    return _native.default.randomUUID();
	  }
	  options = options || {};
	  var rnds = options.random || (options.rng || _rng.default)();

	  // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`
	  rnds[6] = rnds[6] & 0x0f | 0x40;
	  rnds[8] = rnds[8] & 0x3f | 0x80;

	  // Copy bytes to buffer, if provided
	  if (buf) {
	    offset = offset || 0;
	    for (var i = 0; i < 16; ++i) {
	      buf[offset + i] = rnds[i];
	    }
	    return buf;
	  }
	  return (0, _stringify.unsafeStringify)(rnds);
	}
	v4.default = v4$1;
	return v4;
}

var v5 = {};

var sha1 = {};

var hasRequiredSha1;

function requireSha1 () {
	if (hasRequiredSha1) return sha1;
	hasRequiredSha1 = 1;

	Object.defineProperty(sha1, "__esModule", {
	  value: true
	});
	sha1.default = void 0;
	// Adapted from Chris Veness' SHA1 code at
	// http://www.movable-type.co.uk/scripts/sha1.html
	function f(s, x, y, z) {
	  switch (s) {
	    case 0:
	      return x & y ^ ~x & z;
	    case 1:
	      return x ^ y ^ z;
	    case 2:
	      return x & y ^ x & z ^ y & z;
	    case 3:
	      return x ^ y ^ z;
	  }
	}
	function ROTL(x, n) {
	  return x << n | x >>> 32 - n;
	}
	function sha1$1(bytes) {
	  var K = [0x5a827999, 0x6ed9eba1, 0x8f1bbcdc, 0xca62c1d6];
	  var H = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476, 0xc3d2e1f0];
	  if (typeof bytes === 'string') {
	    var msg = unescape(encodeURIComponent(bytes)); // UTF8 escape

	    bytes = [];
	    for (var i = 0; i < msg.length; ++i) {
	      bytes.push(msg.charCodeAt(i));
	    }
	  } else if (!Array.isArray(bytes)) {
	    // Convert Array-like to Array
	    bytes = Array.prototype.slice.call(bytes);
	  }
	  bytes.push(0x80);
	  var l = bytes.length / 4 + 2;
	  var N = Math.ceil(l / 16);
	  var M = new Array(N);
	  for (var _i = 0; _i < N; ++_i) {
	    var arr = new Uint32Array(16);
	    for (var j = 0; j < 16; ++j) {
	      arr[j] = bytes[_i * 64 + j * 4] << 24 | bytes[_i * 64 + j * 4 + 1] << 16 | bytes[_i * 64 + j * 4 + 2] << 8 | bytes[_i * 64 + j * 4 + 3];
	    }
	    M[_i] = arr;
	  }
	  M[N - 1][14] = (bytes.length - 1) * 8 / Math.pow(2, 32);
	  M[N - 1][14] = Math.floor(M[N - 1][14]);
	  M[N - 1][15] = (bytes.length - 1) * 8 & 0xffffffff;
	  for (var _i2 = 0; _i2 < N; ++_i2) {
	    var W = new Uint32Array(80);
	    for (var t = 0; t < 16; ++t) {
	      W[t] = M[_i2][t];
	    }
	    for (var _t = 16; _t < 80; ++_t) {
	      W[_t] = ROTL(W[_t - 3] ^ W[_t - 8] ^ W[_t - 14] ^ W[_t - 16], 1);
	    }
	    var a = H[0];
	    var b = H[1];
	    var c = H[2];
	    var d = H[3];
	    var e = H[4];
	    for (var _t2 = 0; _t2 < 80; ++_t2) {
	      var s = Math.floor(_t2 / 20);
	      var T = ROTL(a, 5) + f(s, b, c, d) + e + K[s] + W[_t2] >>> 0;
	      e = d;
	      d = c;
	      c = ROTL(b, 30) >>> 0;
	      b = a;
	      a = T;
	    }
	    H[0] = H[0] + a >>> 0;
	    H[1] = H[1] + b >>> 0;
	    H[2] = H[2] + c >>> 0;
	    H[3] = H[3] + d >>> 0;
	    H[4] = H[4] + e >>> 0;
	  }
	  return [H[0] >> 24 & 0xff, H[0] >> 16 & 0xff, H[0] >> 8 & 0xff, H[0] & 0xff, H[1] >> 24 & 0xff, H[1] >> 16 & 0xff, H[1] >> 8 & 0xff, H[1] & 0xff, H[2] >> 24 & 0xff, H[2] >> 16 & 0xff, H[2] >> 8 & 0xff, H[2] & 0xff, H[3] >> 24 & 0xff, H[3] >> 16 & 0xff, H[3] >> 8 & 0xff, H[3] & 0xff, H[4] >> 24 & 0xff, H[4] >> 16 & 0xff, H[4] >> 8 & 0xff, H[4] & 0xff];
	}
	sha1.default = sha1$1;
	return sha1;
}

var hasRequiredV5;

function requireV5 () {
	if (hasRequiredV5) return v5;
	hasRequiredV5 = 1;

	Object.defineProperty(v5, "__esModule", {
	  value: true
	});
	v5.default = void 0;
	var _v = _interopRequireDefault(/*@__PURE__*/ requireV35());
	var _sha = _interopRequireDefault(/*@__PURE__*/ requireSha1());
	function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
	var v5$1 = (0, _v.default)('v5', 0x50, _sha.default);
	v5.default = v5$1;
	return v5;
}

var v6 = {};

var hasRequiredV6;

function requireV6 () {
	if (hasRequiredV6) return v6;
	hasRequiredV6 = 1;

	Object.defineProperty(v6, "__esModule", {
	  value: true
	});
	v6.default = v6$1;
	var _stringify = /*@__PURE__*/ requireStringify();
	var _v = _interopRequireDefault(/*@__PURE__*/ requireV1());
	var _v1ToV = _interopRequireDefault(/*@__PURE__*/ requireV1ToV6());
	function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
	function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
	function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), true).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
	function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: true, configurable: true, writable: true }) : e[r] = t, e; }
	function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
	function _toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
	/**
	 *
	 * @param {object} options
	 * @param {Uint8Array=} buf
	 * @param {number=} offset
	 * @returns
	 */
	function v6$1(options = {}, buf, offset = 0) {
	  // v6 is v1 with different field layout, so we start with a v1 UUID, albeit
	  // with slightly different behavior around how the clock_seq and node fields
	  // are randomized, which is why we call v1 with _v6: true.
	  var bytes = (0, _v.default)(_objectSpread(_objectSpread({}, options), {}, {
	    _v6: true
	  }), new Uint8Array(16));

	  // Reorder the fields to v6 layout.
	  bytes = (0, _v1ToV.default)(bytes);

	  // Return as a byte array if requested
	  if (buf) {
	    for (var i = 0; i < 16; i++) {
	      buf[offset + i] = bytes[i];
	    }
	    return buf;
	  }
	  return (0, _stringify.unsafeStringify)(bytes);
	}
	return v6;
}

var v6ToV1 = {};

var hasRequiredV6ToV1;

function requireV6ToV1 () {
	if (hasRequiredV6ToV1) return v6ToV1;
	hasRequiredV6ToV1 = 1;

	Object.defineProperty(v6ToV1, "__esModule", {
	  value: true
	});
	v6ToV1.default = v6ToV1$1;
	var _parse = _interopRequireDefault(/*@__PURE__*/ requireParse());
	var _stringify = /*@__PURE__*/ requireStringify();
	function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
	/**
	 * Convert a v6 UUID to a v1 UUID
	 *
	 * @param {string|Uint8Array} uuid - The v6 UUID to convert to v6
	 * @returns {string|Uint8Array} The v1 UUID as the same type as the `uuid` arg
	 * (string or Uint8Array)
	 */
	function v6ToV1$1(uuid) {
	  var v6Bytes = typeof uuid === 'string' ? (0, _parse.default)(uuid) : uuid;
	  var v1Bytes = _v6ToV1(v6Bytes);
	  return typeof uuid === 'string' ? (0, _stringify.unsafeStringify)(v1Bytes) : v1Bytes;
	}

	// Do the field transformation needed for v6 -> v1
	function _v6ToV1(v6Bytes) {
	  return Uint8Array.of((v6Bytes[3] & 0x0f) << 4 | v6Bytes[4] >> 4 & 0x0f, (v6Bytes[4] & 0x0f) << 4 | (v6Bytes[5] & 0xf0) >> 4, (v6Bytes[5] & 0x0f) << 4 | v6Bytes[6] & 0x0f, v6Bytes[7], (v6Bytes[1] & 0x0f) << 4 | (v6Bytes[2] & 0xf0) >> 4, (v6Bytes[2] & 0x0f) << 4 | (v6Bytes[3] & 0xf0) >> 4, 0x10 | (v6Bytes[0] & 0xf0) >> 4, (v6Bytes[0] & 0x0f) << 4 | (v6Bytes[1] & 0xf0) >> 4, v6Bytes[8], v6Bytes[9], v6Bytes[10], v6Bytes[11], v6Bytes[12], v6Bytes[13], v6Bytes[14], v6Bytes[15]);
	}
	return v6ToV1;
}

var v7 = {};

var hasRequiredV7;

function requireV7 () {
	if (hasRequiredV7) return v7;
	hasRequiredV7 = 1;

	Object.defineProperty(v7, "__esModule", {
	  value: true
	});
	v7.default = void 0;
	var _rng = _interopRequireDefault(/*@__PURE__*/ requireRng());
	var _stringify = /*@__PURE__*/ requireStringify();
	function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
	/**
	 * UUID V7 - Unix Epoch time-based UUID
	 *
	 * The IETF has published RFC9562, introducing 3 new UUID versions (6,7,8). This
	 * implementation of V7 is based on the accepted, though not yet approved,
	 * revisions.
	 *
	 * RFC 9562:https://www.rfc-editor.org/rfc/rfc9562.html Universally Unique
	 * IDentifiers (UUIDs)

	 *
	 * Sample V7 value:
	 * https://www.rfc-editor.org/rfc/rfc9562.html#name-example-of-a-uuidv7-value
	 *
	 * Monotonic Bit Layout: RFC rfc9562.6.2 Method 1, Dedicated Counter Bits ref:
	 *     https://www.rfc-editor.org/rfc/rfc9562.html#section-6.2-5.1
	 *
	 *   0                   1                   2                   3 0 1 2 3 4 5 6
	 *   7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
	 *  +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
	 *  |                          unix_ts_ms                           |
	 *  +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
	 *  |          unix_ts_ms           |  ver  |        seq_hi         |
	 *  +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
	 *  |var|               seq_low               |        rand         |
	 *  +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
	 *  |                             rand                              |
	 *  +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
	 *
	 * seq is a 31 bit serialized counter; comprised of 12 bit seq_hi and 19 bit
	 * seq_low, and randomly initialized upon timestamp change. 31 bit counter size
	 * was selected as any bitwise operations in node are done as _signed_ 32 bit
	 * ints. we exclude the sign bit.
	 */

	var _seqLow = null;
	var _seqHigh = null;
	var _msecs = 0;
	function v7$1(options, buf, offset) {
	  options = options || {};

	  // initialize buffer and pointer
	  var i = buf && offset || 0;
	  var b = buf || new Uint8Array(16);

	  // rnds is Uint8Array(16) filled with random bytes
	  var rnds = options.random || (options.rng || _rng.default)();

	  // milliseconds since unix epoch, 1970-01-01 00:00
	  var msecs = options.msecs !== undefined ? options.msecs : Date.now();

	  // seq is user provided 31 bit counter
	  var seq = options.seq !== undefined ? options.seq : null;

	  // initialize local seq high/low parts
	  var seqHigh = _seqHigh;
	  var seqLow = _seqLow;

	  // check if clock has advanced and user has not provided msecs
	  if (msecs > _msecs && options.msecs === undefined) {
	    _msecs = msecs;

	    // unless user provided seq, reset seq parts
	    if (seq !== null) {
	      seqHigh = null;
	      seqLow = null;
	    }
	  }

	  // if we have a user provided seq
	  if (seq !== null) {
	    // trim provided seq to 31 bits of value, avoiding overflow
	    if (seq > 0x7fffffff) {
	      seq = 0x7fffffff;
	    }

	    // split provided seq into high/low parts
	    seqHigh = seq >>> 19 & 0xfff;
	    seqLow = seq & 0x7ffff;
	  }

	  // randomly initialize seq
	  if (seqHigh === null || seqLow === null) {
	    seqHigh = rnds[6] & 0x7f;
	    seqHigh = seqHigh << 8 | rnds[7];
	    seqLow = rnds[8] & 0x3f; // pad for var
	    seqLow = seqLow << 8 | rnds[9];
	    seqLow = seqLow << 5 | rnds[10] >>> 3;
	  }

	  // increment seq if within msecs window
	  if (msecs + 10000 > _msecs && seq === null) {
	    if (++seqLow > 0x7ffff) {
	      seqLow = 0;
	      if (++seqHigh > 0xfff) {
	        seqHigh = 0;

	        // increment internal _msecs. this allows us to continue incrementing
	        // while staying monotonic. Note, once we hit 10k milliseconds beyond system
	        // clock, we will reset breaking monotonicity (after (2^31)*10000 generations)
	        _msecs++;
	      }
	    }
	  } else {
	    // resetting; we have advanced more than
	    // 10k milliseconds beyond system clock
	    _msecs = msecs;
	  }
	  _seqHigh = seqHigh;
	  _seqLow = seqLow;

	  // [bytes 0-5] 48 bits of local timestamp
	  b[i++] = _msecs / 0x10000000000 & 0xff;
	  b[i++] = _msecs / 0x100000000 & 0xff;
	  b[i++] = _msecs / 0x1000000 & 0xff;
	  b[i++] = _msecs / 0x10000 & 0xff;
	  b[i++] = _msecs / 0x100 & 0xff;
	  b[i++] = _msecs & 0xff;

	  // [byte 6] - set 4 bits of version (7) with first 4 bits seq_hi
	  b[i++] = seqHigh >>> 4 & 0x0f | 0x70;

	  // [byte 7] remaining 8 bits of seq_hi
	  b[i++] = seqHigh & 0xff;

	  // [byte 8] - variant (2 bits), first 6 bits seq_low
	  b[i++] = seqLow >>> 13 & 0x3f | 0x80;

	  // [byte 9] 8 bits seq_low
	  b[i++] = seqLow >>> 5 & 0xff;

	  // [byte 10] remaining 5 bits seq_low, 3 bits random
	  b[i++] = seqLow << 3 & 0xff | rnds[10] & 0x07;

	  // [bytes 11-15] always random
	  b[i++] = rnds[11];
	  b[i++] = rnds[12];
	  b[i++] = rnds[13];
	  b[i++] = rnds[14];
	  b[i++] = rnds[15];
	  return buf || (0, _stringify.unsafeStringify)(b);
	}
	v7.default = v7$1;
	return v7;
}

var version$1 = {};

var hasRequiredVersion;

function requireVersion () {
	if (hasRequiredVersion) return version$1;
	hasRequiredVersion = 1;

	Object.defineProperty(version$1, "__esModule", {
	  value: true
	});
	version$1.default = void 0;
	var _validate = _interopRequireDefault(/*@__PURE__*/ requireValidate());
	function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
	function version(uuid) {
	  if (!(0, _validate.default)(uuid)) {
	    throw TypeError('Invalid UUID');
	  }
	  return parseInt(uuid.slice(14, 15), 16);
	}
	version$1.default = version;
	return version$1;
}

var hasRequiredCommonjsBrowser;

function requireCommonjsBrowser () {
	if (hasRequiredCommonjsBrowser) return commonjsBrowser;
	hasRequiredCommonjsBrowser = 1;
	(function (exports$1) {

		Object.defineProperty(exports$1, "__esModule", {
		  value: true
		});
		Object.defineProperty(exports$1, "MAX", {
		  enumerable: true,
		  get: function get() {
		    return _max.default;
		  }
		});
		Object.defineProperty(exports$1, "NIL", {
		  enumerable: true,
		  get: function get() {
		    return _nil.default;
		  }
		});
		Object.defineProperty(exports$1, "parse", {
		  enumerable: true,
		  get: function get() {
		    return _parse.default;
		  }
		});
		Object.defineProperty(exports$1, "stringify", {
		  enumerable: true,
		  get: function get() {
		    return _stringify.default;
		  }
		});
		Object.defineProperty(exports$1, "v1", {
		  enumerable: true,
		  get: function get() {
		    return _v.default;
		  }
		});
		Object.defineProperty(exports$1, "v1ToV6", {
		  enumerable: true,
		  get: function get() {
		    return _v1ToV.default;
		  }
		});
		Object.defineProperty(exports$1, "v3", {
		  enumerable: true,
		  get: function get() {
		    return _v2.default;
		  }
		});
		Object.defineProperty(exports$1, "v4", {
		  enumerable: true,
		  get: function get() {
		    return _v3.default;
		  }
		});
		Object.defineProperty(exports$1, "v5", {
		  enumerable: true,
		  get: function get() {
		    return _v4.default;
		  }
		});
		Object.defineProperty(exports$1, "v6", {
		  enumerable: true,
		  get: function get() {
		    return _v5.default;
		  }
		});
		Object.defineProperty(exports$1, "v6ToV1", {
		  enumerable: true,
		  get: function get() {
		    return _v6ToV.default;
		  }
		});
		Object.defineProperty(exports$1, "v7", {
		  enumerable: true,
		  get: function get() {
		    return _v6.default;
		  }
		});
		Object.defineProperty(exports$1, "validate", {
		  enumerable: true,
		  get: function get() {
		    return _validate.default;
		  }
		});
		Object.defineProperty(exports$1, "version", {
		  enumerable: true,
		  get: function get() {
		    return _version.default;
		  }
		});
		var _max = _interopRequireDefault(/*@__PURE__*/ requireMax());
		var _nil = _interopRequireDefault(/*@__PURE__*/ requireNil());
		var _parse = _interopRequireDefault(/*@__PURE__*/ requireParse());
		var _stringify = _interopRequireDefault(/*@__PURE__*/ requireStringify());
		var _v = _interopRequireDefault(/*@__PURE__*/ requireV1());
		var _v1ToV = _interopRequireDefault(/*@__PURE__*/ requireV1ToV6());
		var _v2 = _interopRequireDefault(/*@__PURE__*/ requireV3());
		var _v3 = _interopRequireDefault(/*@__PURE__*/ requireV4());
		var _v4 = _interopRequireDefault(/*@__PURE__*/ requireV5());
		var _v5 = _interopRequireDefault(/*@__PURE__*/ requireV6());
		var _v6ToV = _interopRequireDefault(/*@__PURE__*/ requireV6ToV1());
		var _v6 = _interopRequireDefault(/*@__PURE__*/ requireV7());
		var _validate = _interopRequireDefault(/*@__PURE__*/ requireValidate());
		var _version = _interopRequireDefault(/*@__PURE__*/ requireVersion());
		function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; } 
	} (commonjsBrowser));
	return commonjsBrowser;
}

var hasRequiredRequest;

function requireRequest () {
	if (hasRequiredRequest) return request;
	hasRequiredRequest = 1;
	(function (exports$1) {
		var __awaiter = (request && request.__awaiter) || function (thisArg, _arguments, P, generator) {
		    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
		    return new (P || (P = Promise))(function (resolve, reject) {
		        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
		        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
		        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
		        step((generator = generator.apply(thisArg, _arguments || [])).next());
		    });
		};
		Object.defineProperty(exports$1, "__esModule", { value: true });
		exports$1.SvixRequest = exports$1.HttpMethod = exports$1.LIB_VERSION = void 0;
		const util_1 = requireUtil();
		const uuid_1 = /*@__PURE__*/ requireCommonjsBrowser();
		exports$1.LIB_VERSION = "1.90.0";
		const USER_AGENT = `svix-libs/${exports$1.LIB_VERSION}/javascript`;
		(function (HttpMethod) {
		    HttpMethod["GET"] = "GET";
		    HttpMethod["HEAD"] = "HEAD";
		    HttpMethod["POST"] = "POST";
		    HttpMethod["PUT"] = "PUT";
		    HttpMethod["DELETE"] = "DELETE";
		    HttpMethod["CONNECT"] = "CONNECT";
		    HttpMethod["OPTIONS"] = "OPTIONS";
		    HttpMethod["TRACE"] = "TRACE";
		    HttpMethod["PATCH"] = "PATCH";
		})(exports$1.HttpMethod || (exports$1.HttpMethod = {}));
		class SvixRequest {
		    constructor(method, path) {
		        this.method = method;
		        this.path = path;
		        this.queryParams = {};
		        this.headerParams = {};
		    }
		    setPathParam(name, value) {
		        const newPath = this.path.replace(`{${name}}`, encodeURIComponent(value));
		        if (this.path === newPath) {
		            throw new Error(`path parameter ${name} not found`);
		        }
		        this.path = newPath;
		    }
		    setQueryParams(params) {
		        for (const [name, value] of Object.entries(params)) {
		            this.setQueryParam(name, value);
		        }
		    }
		    setQueryParam(name, value) {
		        if (value === undefined || value === null) {
		            return;
		        }
		        if (typeof value === "string") {
		            this.queryParams[name] = value;
		        }
		        else if (typeof value === "boolean" || typeof value === "number") {
		            this.queryParams[name] = value.toString();
		        }
		        else if (value instanceof Date) {
		            this.queryParams[name] = value.toISOString();
		        }
		        else if (Array.isArray(value)) {
		            if (value.length > 0) {
		                this.queryParams[name] = value.join(",");
		            }
		        }
		        else {
		            throw new Error(`query parameter ${name} has unsupported type`);
		        }
		    }
		    setHeaderParam(name, value) {
		        if (value === undefined) {
		            return;
		        }
		        this.headerParams[name] = value;
		    }
		    setBody(value) {
		        this.body = JSON.stringify(value);
		    }
		    send(ctx, parseResponseBody) {
		        return __awaiter(this, void 0, void 0, function* () {
		            const response = yield this.sendInner(ctx);
		            if (response.status === 204) {
		                return null;
		            }
		            const responseBody = yield response.text();
		            return parseResponseBody(JSON.parse(responseBody));
		        });
		    }
		    sendNoResponseBody(ctx) {
		        return __awaiter(this, void 0, void 0, function* () {
		            yield this.sendInner(ctx);
		        });
		    }
		    sendInner(ctx) {
		        var _a, _b;
		        return __awaiter(this, void 0, void 0, function* () {
		            const url = new URL(ctx.baseUrl + this.path);
		            for (const [name, value] of Object.entries(this.queryParams)) {
		                url.searchParams.set(name, value);
		            }
		            if (this.headerParams["idempotency-key"] === undefined &&
		                this.method.toUpperCase() === "POST") {
		                this.headerParams["idempotency-key"] = `auto_${(0, uuid_1.v4)()}`;
		            }
		            const randomId = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
		            if (this.body != null) {
		                this.headerParams["content-type"] = "application/json";
		            }
		            const isCredentialsSupported = "credentials" in Request.prototype;
		            const response = yield sendWithRetry(url, {
		                method: this.method.toString(),
		                body: this.body,
		                headers: Object.assign({ accept: "application/json, */*;q=0.8", authorization: `Bearer ${ctx.token}`, "user-agent": USER_AGENT, "svix-req-id": randomId.toString() }, this.headerParams),
		                credentials: isCredentialsSupported ? "same-origin" : undefined,
		                signal: ctx.timeout !== undefined ? AbortSignal.timeout(ctx.timeout) : undefined,
		            }, ctx.retryScheduleInMs, (_a = ctx.retryScheduleInMs) === null || _a === void 0 ? void 0 : _a[0], ((_b = ctx.retryScheduleInMs) === null || _b === void 0 ? void 0 : _b.length) || ctx.numRetries, ctx.fetch);
		            return filterResponseForErrors(response);
		        });
		    }
		}
		exports$1.SvixRequest = SvixRequest;
		function filterResponseForErrors(response) {
		    return __awaiter(this, void 0, void 0, function* () {
		        if (response.status < 300) {
		            return response;
		        }
		        const responseBody = yield response.text();
		        if (response.status === 422) {
		            throw new util_1.ApiException(response.status, JSON.parse(responseBody), response.headers);
		        }
		        if (response.status >= 400 && response.status <= 499) {
		            throw new util_1.ApiException(response.status, JSON.parse(responseBody), response.headers);
		        }
		        throw new util_1.ApiException(response.status, responseBody, response.headers);
		    });
		}
		function sendWithRetry(url, init, retryScheduleInMs, nextInterval = 50, triesLeft = 2, fetchImpl = fetch, retryCount = 1) {
		    return __awaiter(this, void 0, void 0, function* () {
		        const sleep = (interval) => new Promise((resolve) => setTimeout(resolve, interval));
		        try {
		            const response = yield fetchImpl(url, init);
		            if (triesLeft <= 0 || response.status < 500) {
		                return response;
		            }
		        }
		        catch (e) {
		            if (triesLeft <= 0) {
		                throw e;
		            }
		        }
		        yield sleep(nextInterval);
		        init.headers["svix-retry-count"] = retryCount.toString();
		        nextInterval = (retryScheduleInMs === null || retryScheduleInMs === void 0 ? void 0 : retryScheduleInMs[retryCount]) || nextInterval * 2;
		        return yield sendWithRetry(url, init, retryScheduleInMs, nextInterval, --triesLeft, fetchImpl, ++retryCount);
		    });
		}
		
	} (request));
	return request;
}

var hasRequiredApplication;

function requireApplication () {
	if (hasRequiredApplication) return application;
	hasRequiredApplication = 1;
	Object.defineProperty(application, "__esModule", { value: true });
	application.Application = void 0;
	const applicationIn_1 = requireApplicationIn();
	const applicationOut_1 = requireApplicationOut();
	const applicationPatch_1 = requireApplicationPatch();
	const listResponseApplicationOut_1 = requireListResponseApplicationOut();
	const request_1 = requireRequest();
	class Application {
	    constructor(requestCtx) {
	        this.requestCtx = requestCtx;
	    }
	    list(options) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/app");
	        request.setQueryParams({
	            exclude_apps_with_no_endpoints: options === null || options === void 0 ? void 0 : options.excludeAppsWithNoEndpoints,
	            exclude_apps_with_disabled_endpoints: options === null || options === void 0 ? void 0 : options.excludeAppsWithDisabledEndpoints,
	            exclude_apps_with_svix_play_endpoints: options === null || options === void 0 ? void 0 : options.excludeAppsWithSvixPlayEndpoints,
	            limit: options === null || options === void 0 ? void 0 : options.limit,
	            iterator: options === null || options === void 0 ? void 0 : options.iterator,
	            order: options === null || options === void 0 ? void 0 : options.order,
	        });
	        return request.send(this.requestCtx, listResponseApplicationOut_1.ListResponseApplicationOutSerializer._fromJsonObject);
	    }
	    create(applicationIn, options) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/app");
	        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
	        request.setBody(applicationIn_1.ApplicationInSerializer._toJsonObject(applicationIn));
	        return request.send(this.requestCtx, applicationOut_1.ApplicationOutSerializer._fromJsonObject);
	    }
	    getOrCreate(applicationIn, options) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/app");
	        request.setQueryParam("get_if_exists", true);
	        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
	        request.setBody(applicationIn_1.ApplicationInSerializer._toJsonObject(applicationIn));
	        return request.send(this.requestCtx, applicationOut_1.ApplicationOutSerializer._fromJsonObject);
	    }
	    get(appId) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/app/{app_id}");
	        request.setPathParam("app_id", appId);
	        return request.send(this.requestCtx, applicationOut_1.ApplicationOutSerializer._fromJsonObject);
	    }
	    update(appId, applicationIn) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.PUT, "/api/v1/app/{app_id}");
	        request.setPathParam("app_id", appId);
	        request.setBody(applicationIn_1.ApplicationInSerializer._toJsonObject(applicationIn));
	        return request.send(this.requestCtx, applicationOut_1.ApplicationOutSerializer._fromJsonObject);
	    }
	    delete(appId) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.DELETE, "/api/v1/app/{app_id}");
	        request.setPathParam("app_id", appId);
	        return request.sendNoResponseBody(this.requestCtx);
	    }
	    patch(appId, applicationPatch) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.PATCH, "/api/v1/app/{app_id}");
	        request.setPathParam("app_id", appId);
	        request.setBody(applicationPatch_1.ApplicationPatchSerializer._toJsonObject(applicationPatch));
	        return request.send(this.requestCtx, applicationOut_1.ApplicationOutSerializer._fromJsonObject);
	    }
	}
	application.Application = Application;
	
	return application;
}

var authentication = {};

var apiTokenOut = {};

var hasRequiredApiTokenOut;

function requireApiTokenOut () {
	if (hasRequiredApiTokenOut) return apiTokenOut;
	hasRequiredApiTokenOut = 1;
	Object.defineProperty(apiTokenOut, "__esModule", { value: true });
	apiTokenOut.ApiTokenOutSerializer = void 0;
	apiTokenOut.ApiTokenOutSerializer = {
	    _fromJsonObject(object) {
	        return {
	            createdAt: new Date(object["createdAt"]),
	            expiresAt: object["expiresAt"] ? new Date(object["expiresAt"]) : null,
	            id: object["id"],
	            name: object["name"],
	            scopes: object["scopes"],
	            token: object["token"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            createdAt: self.createdAt,
	            expiresAt: self.expiresAt,
	            id: self.id,
	            name: self.name,
	            scopes: self.scopes,
	            token: self.token,
	        };
	    },
	};
	
	return apiTokenOut;
}

var appPortalAccessIn = {};

var appPortalCapability = {};

var hasRequiredAppPortalCapability;

function requireAppPortalCapability () {
	if (hasRequiredAppPortalCapability) return appPortalCapability;
	hasRequiredAppPortalCapability = 1;
	(function (exports$1) {
		Object.defineProperty(exports$1, "__esModule", { value: true });
		exports$1.AppPortalCapabilitySerializer = exports$1.AppPortalCapability = void 0;
		(function (AppPortalCapability) {
		    AppPortalCapability["ViewBase"] = "ViewBase";
		    AppPortalCapability["ViewEndpointSecret"] = "ViewEndpointSecret";
		    AppPortalCapability["ManageEndpointSecret"] = "ManageEndpointSecret";
		    AppPortalCapability["ManageTransformations"] = "ManageTransformations";
		    AppPortalCapability["CreateAttempts"] = "CreateAttempts";
		    AppPortalCapability["ManageEndpoint"] = "ManageEndpoint";
		})(exports$1.AppPortalCapability || (exports$1.AppPortalCapability = {}));
		exports$1.AppPortalCapabilitySerializer = {
		    _fromJsonObject(object) {
		        return object;
		    },
		    _toJsonObject(self) {
		        return self;
		    },
		};
		
	} (appPortalCapability));
	return appPortalCapability;
}

var hasRequiredAppPortalAccessIn;

function requireAppPortalAccessIn () {
	if (hasRequiredAppPortalAccessIn) return appPortalAccessIn;
	hasRequiredAppPortalAccessIn = 1;
	Object.defineProperty(appPortalAccessIn, "__esModule", { value: true });
	appPortalAccessIn.AppPortalAccessInSerializer = void 0;
	const appPortalCapability_1 = requireAppPortalCapability();
	const applicationIn_1 = requireApplicationIn();
	appPortalAccessIn.AppPortalAccessInSerializer = {
	    _fromJsonObject(object) {
	        var _a;
	        return {
	            application: object["application"] != null
	                ? applicationIn_1.ApplicationInSerializer._fromJsonObject(object["application"])
	                : undefined,
	            capabilities: (_a = object["capabilities"]) === null || _a === void 0 ? void 0 : _a.map((item) => appPortalCapability_1.AppPortalCapabilitySerializer._fromJsonObject(item)),
	            expiry: object["expiry"],
	            featureFlags: object["featureFlags"],
	            readOnly: object["readOnly"],
	            sessionId: object["sessionId"],
	        };
	    },
	    _toJsonObject(self) {
	        var _a;
	        return {
	            application: self.application != null
	                ? applicationIn_1.ApplicationInSerializer._toJsonObject(self.application)
	                : undefined,
	            capabilities: (_a = self.capabilities) === null || _a === void 0 ? void 0 : _a.map((item) => appPortalCapability_1.AppPortalCapabilitySerializer._toJsonObject(item)),
	            expiry: self.expiry,
	            featureFlags: self.featureFlags,
	            readOnly: self.readOnly,
	            sessionId: self.sessionId,
	        };
	    },
	};
	
	return appPortalAccessIn;
}

var appPortalAccessOut = {};

var hasRequiredAppPortalAccessOut;

function requireAppPortalAccessOut () {
	if (hasRequiredAppPortalAccessOut) return appPortalAccessOut;
	hasRequiredAppPortalAccessOut = 1;
	Object.defineProperty(appPortalAccessOut, "__esModule", { value: true });
	appPortalAccessOut.AppPortalAccessOutSerializer = void 0;
	appPortalAccessOut.AppPortalAccessOutSerializer = {
	    _fromJsonObject(object) {
	        return {
	            token: object["token"],
	            url: object["url"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            token: self.token,
	            url: self.url,
	        };
	    },
	};
	
	return appPortalAccessOut;
}

var applicationTokenExpireIn = {};

var hasRequiredApplicationTokenExpireIn;

function requireApplicationTokenExpireIn () {
	if (hasRequiredApplicationTokenExpireIn) return applicationTokenExpireIn;
	hasRequiredApplicationTokenExpireIn = 1;
	Object.defineProperty(applicationTokenExpireIn, "__esModule", { value: true });
	applicationTokenExpireIn.ApplicationTokenExpireInSerializer = void 0;
	applicationTokenExpireIn.ApplicationTokenExpireInSerializer = {
	    _fromJsonObject(object) {
	        return {
	            expiry: object["expiry"],
	            sessionIds: object["sessionIds"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            expiry: self.expiry,
	            sessionIds: self.sessionIds,
	        };
	    },
	};
	
	return applicationTokenExpireIn;
}

var rotatePollerTokenIn = {};

var hasRequiredRotatePollerTokenIn;

function requireRotatePollerTokenIn () {
	if (hasRequiredRotatePollerTokenIn) return rotatePollerTokenIn;
	hasRequiredRotatePollerTokenIn = 1;
	Object.defineProperty(rotatePollerTokenIn, "__esModule", { value: true });
	rotatePollerTokenIn.RotatePollerTokenInSerializer = void 0;
	rotatePollerTokenIn.RotatePollerTokenInSerializer = {
	    _fromJsonObject(object) {
	        return {
	            expiry: object["expiry"],
	            oldTokenExpiry: object["oldTokenExpiry"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            expiry: self.expiry,
	            oldTokenExpiry: self.oldTokenExpiry,
	        };
	    },
	};
	
	return rotatePollerTokenIn;
}

var streamPortalAccessIn = {};

var hasRequiredStreamPortalAccessIn;

function requireStreamPortalAccessIn () {
	if (hasRequiredStreamPortalAccessIn) return streamPortalAccessIn;
	hasRequiredStreamPortalAccessIn = 1;
	Object.defineProperty(streamPortalAccessIn, "__esModule", { value: true });
	streamPortalAccessIn.StreamPortalAccessInSerializer = void 0;
	streamPortalAccessIn.StreamPortalAccessInSerializer = {
	    _fromJsonObject(object) {
	        return {
	            expiry: object["expiry"],
	            featureFlags: object["featureFlags"],
	            sessionId: object["sessionId"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            expiry: self.expiry,
	            featureFlags: self.featureFlags,
	            sessionId: self.sessionId,
	        };
	    },
	};
	
	return streamPortalAccessIn;
}

var streamTokenExpireIn = {};

var hasRequiredStreamTokenExpireIn;

function requireStreamTokenExpireIn () {
	if (hasRequiredStreamTokenExpireIn) return streamTokenExpireIn;
	hasRequiredStreamTokenExpireIn = 1;
	Object.defineProperty(streamTokenExpireIn, "__esModule", { value: true });
	streamTokenExpireIn.StreamTokenExpireInSerializer = void 0;
	streamTokenExpireIn.StreamTokenExpireInSerializer = {
	    _fromJsonObject(object) {
	        return {
	            expiry: object["expiry"],
	            sessionIds: object["sessionIds"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            expiry: self.expiry,
	            sessionIds: self.sessionIds,
	        };
	    },
	};
	
	return streamTokenExpireIn;
}

var dashboardAccessOut = {};

var hasRequiredDashboardAccessOut;

function requireDashboardAccessOut () {
	if (hasRequiredDashboardAccessOut) return dashboardAccessOut;
	hasRequiredDashboardAccessOut = 1;
	Object.defineProperty(dashboardAccessOut, "__esModule", { value: true });
	dashboardAccessOut.DashboardAccessOutSerializer = void 0;
	dashboardAccessOut.DashboardAccessOutSerializer = {
	    _fromJsonObject(object) {
	        return {
	            token: object["token"],
	            url: object["url"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            token: self.token,
	            url: self.url,
	        };
	    },
	};
	
	return dashboardAccessOut;
}

var hasRequiredAuthentication;

function requireAuthentication () {
	if (hasRequiredAuthentication) return authentication;
	hasRequiredAuthentication = 1;
	Object.defineProperty(authentication, "__esModule", { value: true });
	authentication.Authentication = void 0;
	const apiTokenOut_1 = requireApiTokenOut();
	const appPortalAccessIn_1 = requireAppPortalAccessIn();
	const appPortalAccessOut_1 = requireAppPortalAccessOut();
	const applicationTokenExpireIn_1 = requireApplicationTokenExpireIn();
	const rotatePollerTokenIn_1 = requireRotatePollerTokenIn();
	const streamPortalAccessIn_1 = requireStreamPortalAccessIn();
	const streamTokenExpireIn_1 = requireStreamTokenExpireIn();
	const dashboardAccessOut_1 = requireDashboardAccessOut();
	const request_1 = requireRequest();
	class Authentication {
	    constructor(requestCtx) {
	        this.requestCtx = requestCtx;
	    }
	    appPortalAccess(appId, appPortalAccessIn, options) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/auth/app-portal-access/{app_id}");
	        request.setPathParam("app_id", appId);
	        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
	        request.setBody(appPortalAccessIn_1.AppPortalAccessInSerializer._toJsonObject(appPortalAccessIn));
	        return request.send(this.requestCtx, appPortalAccessOut_1.AppPortalAccessOutSerializer._fromJsonObject);
	    }
	    expireAll(appId, applicationTokenExpireIn, options) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/auth/app/{app_id}/expire-all");
	        request.setPathParam("app_id", appId);
	        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
	        request.setBody(applicationTokenExpireIn_1.ApplicationTokenExpireInSerializer._toJsonObject(applicationTokenExpireIn));
	        return request.sendNoResponseBody(this.requestCtx);
	    }
	    dashboardAccess(appId, options) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/auth/dashboard-access/{app_id}");
	        request.setPathParam("app_id", appId);
	        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
	        return request.send(this.requestCtx, dashboardAccessOut_1.DashboardAccessOutSerializer._fromJsonObject);
	    }
	    logout(options) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/auth/logout");
	        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
	        return request.sendNoResponseBody(this.requestCtx);
	    }
	    streamLogout(options) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/auth/stream-logout");
	        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
	        return request.sendNoResponseBody(this.requestCtx);
	    }
	    streamPortalAccess(streamId, streamPortalAccessIn, options) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/auth/stream-portal-access/{stream_id}");
	        request.setPathParam("stream_id", streamId);
	        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
	        request.setBody(streamPortalAccessIn_1.StreamPortalAccessInSerializer._toJsonObject(streamPortalAccessIn));
	        return request.send(this.requestCtx, appPortalAccessOut_1.AppPortalAccessOutSerializer._fromJsonObject);
	    }
	    streamExpireAll(streamId, streamTokenExpireIn, options) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/auth/stream/{stream_id}/expire-all");
	        request.setPathParam("stream_id", streamId);
	        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
	        request.setBody(streamTokenExpireIn_1.StreamTokenExpireInSerializer._toJsonObject(streamTokenExpireIn));
	        return request.sendNoResponseBody(this.requestCtx);
	    }
	    getStreamPollerToken(streamId, sinkId) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/auth/stream/{stream_id}/sink/{sink_id}/poller/token");
	        request.setPathParam("stream_id", streamId);
	        request.setPathParam("sink_id", sinkId);
	        return request.send(this.requestCtx, apiTokenOut_1.ApiTokenOutSerializer._fromJsonObject);
	    }
	    rotateStreamPollerToken(streamId, sinkId, rotatePollerTokenIn, options) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/auth/stream/{stream_id}/sink/{sink_id}/poller/token/rotate");
	        request.setPathParam("stream_id", streamId);
	        request.setPathParam("sink_id", sinkId);
	        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
	        request.setBody(rotatePollerTokenIn_1.RotatePollerTokenInSerializer._toJsonObject(rotatePollerTokenIn));
	        return request.send(this.requestCtx, apiTokenOut_1.ApiTokenOutSerializer._fromJsonObject);
	    }
	}
	authentication.Authentication = Authentication;
	
	return authentication;
}

var backgroundTask = {};

var backgroundTaskOut = {};

var backgroundTaskStatus = {};

var hasRequiredBackgroundTaskStatus;

function requireBackgroundTaskStatus () {
	if (hasRequiredBackgroundTaskStatus) return backgroundTaskStatus;
	hasRequiredBackgroundTaskStatus = 1;
	(function (exports$1) {
		Object.defineProperty(exports$1, "__esModule", { value: true });
		exports$1.BackgroundTaskStatusSerializer = exports$1.BackgroundTaskStatus = void 0;
		(function (BackgroundTaskStatus) {
		    BackgroundTaskStatus["Running"] = "running";
		    BackgroundTaskStatus["Finished"] = "finished";
		    BackgroundTaskStatus["Failed"] = "failed";
		})(exports$1.BackgroundTaskStatus || (exports$1.BackgroundTaskStatus = {}));
		exports$1.BackgroundTaskStatusSerializer = {
		    _fromJsonObject(object) {
		        return object;
		    },
		    _toJsonObject(self) {
		        return self;
		    },
		};
		
	} (backgroundTaskStatus));
	return backgroundTaskStatus;
}

var backgroundTaskType = {};

var hasRequiredBackgroundTaskType;

function requireBackgroundTaskType () {
	if (hasRequiredBackgroundTaskType) return backgroundTaskType;
	hasRequiredBackgroundTaskType = 1;
	(function (exports$1) {
		Object.defineProperty(exports$1, "__esModule", { value: true });
		exports$1.BackgroundTaskTypeSerializer = exports$1.BackgroundTaskType = void 0;
		(function (BackgroundTaskType) {
		    BackgroundTaskType["EndpointReplay"] = "endpoint.replay";
		    BackgroundTaskType["EndpointRecover"] = "endpoint.recover";
		    BackgroundTaskType["ApplicationStats"] = "application.stats";
		    BackgroundTaskType["MessageBroadcast"] = "message.broadcast";
		    BackgroundTaskType["SdkGenerate"] = "sdk.generate";
		    BackgroundTaskType["EventTypeAggregate"] = "event-type.aggregate";
		    BackgroundTaskType["ApplicationPurgeContent"] = "application.purge_content";
		    BackgroundTaskType["EndpointBulkReplay"] = "endpoint.bulk-replay";
		})(exports$1.BackgroundTaskType || (exports$1.BackgroundTaskType = {}));
		exports$1.BackgroundTaskTypeSerializer = {
		    _fromJsonObject(object) {
		        return object;
		    },
		    _toJsonObject(self) {
		        return self;
		    },
		};
		
	} (backgroundTaskType));
	return backgroundTaskType;
}

var hasRequiredBackgroundTaskOut;

function requireBackgroundTaskOut () {
	if (hasRequiredBackgroundTaskOut) return backgroundTaskOut;
	hasRequiredBackgroundTaskOut = 1;
	Object.defineProperty(backgroundTaskOut, "__esModule", { value: true });
	backgroundTaskOut.BackgroundTaskOutSerializer = void 0;
	const backgroundTaskStatus_1 = requireBackgroundTaskStatus();
	const backgroundTaskType_1 = requireBackgroundTaskType();
	backgroundTaskOut.BackgroundTaskOutSerializer = {
	    _fromJsonObject(object) {
	        return {
	            data: object["data"],
	            id: object["id"],
	            status: backgroundTaskStatus_1.BackgroundTaskStatusSerializer._fromJsonObject(object["status"]),
	            task: backgroundTaskType_1.BackgroundTaskTypeSerializer._fromJsonObject(object["task"]),
	            updatedAt: new Date(object["updatedAt"]),
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            data: self.data,
	            id: self.id,
	            status: backgroundTaskStatus_1.BackgroundTaskStatusSerializer._toJsonObject(self.status),
	            task: backgroundTaskType_1.BackgroundTaskTypeSerializer._toJsonObject(self.task),
	            updatedAt: self.updatedAt,
	        };
	    },
	};
	
	return backgroundTaskOut;
}

var listResponseBackgroundTaskOut = {};

var hasRequiredListResponseBackgroundTaskOut;

function requireListResponseBackgroundTaskOut () {
	if (hasRequiredListResponseBackgroundTaskOut) return listResponseBackgroundTaskOut;
	hasRequiredListResponseBackgroundTaskOut = 1;
	Object.defineProperty(listResponseBackgroundTaskOut, "__esModule", { value: true });
	listResponseBackgroundTaskOut.ListResponseBackgroundTaskOutSerializer = void 0;
	const backgroundTaskOut_1 = requireBackgroundTaskOut();
	listResponseBackgroundTaskOut.ListResponseBackgroundTaskOutSerializer = {
	    _fromJsonObject(object) {
	        return {
	            data: object["data"].map((item) => backgroundTaskOut_1.BackgroundTaskOutSerializer._fromJsonObject(item)),
	            done: object["done"],
	            iterator: object["iterator"],
	            prevIterator: object["prevIterator"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            data: self.data.map((item) => backgroundTaskOut_1.BackgroundTaskOutSerializer._toJsonObject(item)),
	            done: self.done,
	            iterator: self.iterator,
	            prevIterator: self.prevIterator,
	        };
	    },
	};
	
	return listResponseBackgroundTaskOut;
}

var hasRequiredBackgroundTask;

function requireBackgroundTask () {
	if (hasRequiredBackgroundTask) return backgroundTask;
	hasRequiredBackgroundTask = 1;
	Object.defineProperty(backgroundTask, "__esModule", { value: true });
	backgroundTask.BackgroundTask = void 0;
	const backgroundTaskOut_1 = requireBackgroundTaskOut();
	const listResponseBackgroundTaskOut_1 = requireListResponseBackgroundTaskOut();
	const request_1 = requireRequest();
	class BackgroundTask {
	    constructor(requestCtx) {
	        this.requestCtx = requestCtx;
	    }
	    list(options) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/background-task");
	        request.setQueryParams({
	            status: options === null || options === void 0 ? void 0 : options.status,
	            task: options === null || options === void 0 ? void 0 : options.task,
	            limit: options === null || options === void 0 ? void 0 : options.limit,
	            iterator: options === null || options === void 0 ? void 0 : options.iterator,
	            order: options === null || options === void 0 ? void 0 : options.order,
	        });
	        return request.send(this.requestCtx, listResponseBackgroundTaskOut_1.ListResponseBackgroundTaskOutSerializer._fromJsonObject);
	    }
	    listByEndpoint(options) {
	        return this.list(options);
	    }
	    get(taskId) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/background-task/{task_id}");
	        request.setPathParam("task_id", taskId);
	        return request.send(this.requestCtx, backgroundTaskOut_1.BackgroundTaskOutSerializer._fromJsonObject);
	    }
	}
	backgroundTask.BackgroundTask = BackgroundTask;
	
	return backgroundTask;
}

var connector = {};

var connectorIn = {};

var connectorKind = {};

var hasRequiredConnectorKind;

function requireConnectorKind () {
	if (hasRequiredConnectorKind) return connectorKind;
	hasRequiredConnectorKind = 1;
	(function (exports$1) {
		Object.defineProperty(exports$1, "__esModule", { value: true });
		exports$1.ConnectorKindSerializer = exports$1.ConnectorKind = void 0;
		(function (ConnectorKind) {
		    ConnectorKind["Custom"] = "Custom";
		    ConnectorKind["AgenticCommerceProtocol"] = "AgenticCommerceProtocol";
		    ConnectorKind["CloseCrm"] = "CloseCRM";
		    ConnectorKind["CustomerIo"] = "CustomerIO";
		    ConnectorKind["Discord"] = "Discord";
		    ConnectorKind["Hubspot"] = "Hubspot";
		    ConnectorKind["Inngest"] = "Inngest";
		    ConnectorKind["Loops"] = "Loops";
		    ConnectorKind["Otel"] = "Otel";
		    ConnectorKind["Resend"] = "Resend";
		    ConnectorKind["Salesforce"] = "Salesforce";
		    ConnectorKind["Segment"] = "Segment";
		    ConnectorKind["Sendgrid"] = "Sendgrid";
		    ConnectorKind["Slack"] = "Slack";
		    ConnectorKind["Teams"] = "Teams";
		    ConnectorKind["TriggerDev"] = "TriggerDev";
		    ConnectorKind["Windmill"] = "Windmill";
		    ConnectorKind["Zapier"] = "Zapier";
		})(exports$1.ConnectorKind || (exports$1.ConnectorKind = {}));
		exports$1.ConnectorKindSerializer = {
		    _fromJsonObject(object) {
		        return object;
		    },
		    _toJsonObject(self) {
		        return self;
		    },
		};
		
	} (connectorKind));
	return connectorKind;
}

var connectorProduct = {};

var hasRequiredConnectorProduct;

function requireConnectorProduct () {
	if (hasRequiredConnectorProduct) return connectorProduct;
	hasRequiredConnectorProduct = 1;
	(function (exports$1) {
		Object.defineProperty(exports$1, "__esModule", { value: true });
		exports$1.ConnectorProductSerializer = exports$1.ConnectorProduct = void 0;
		(function (ConnectorProduct) {
		    ConnectorProduct["Dispatch"] = "Dispatch";
		    ConnectorProduct["Stream"] = "Stream";
		})(exports$1.ConnectorProduct || (exports$1.ConnectorProduct = {}));
		exports$1.ConnectorProductSerializer = {
		    _fromJsonObject(object) {
		        return object;
		    },
		    _toJsonObject(self) {
		        return self;
		    },
		};
		
	} (connectorProduct));
	return connectorProduct;
}

var hasRequiredConnectorIn;

function requireConnectorIn () {
	if (hasRequiredConnectorIn) return connectorIn;
	hasRequiredConnectorIn = 1;
	Object.defineProperty(connectorIn, "__esModule", { value: true });
	connectorIn.ConnectorInSerializer = void 0;
	const connectorKind_1 = requireConnectorKind();
	const connectorProduct_1 = requireConnectorProduct();
	connectorIn.ConnectorInSerializer = {
	    _fromJsonObject(object) {
	        return {
	            allowedEventTypes: object["allowedEventTypes"],
	            description: object["description"],
	            featureFlags: object["featureFlags"],
	            instructions: object["instructions"],
	            kind: object["kind"] != null
	                ? connectorKind_1.ConnectorKindSerializer._fromJsonObject(object["kind"])
	                : undefined,
	            logo: object["logo"],
	            name: object["name"],
	            productType: object["productType"] != null
	                ? connectorProduct_1.ConnectorProductSerializer._fromJsonObject(object["productType"])
	                : undefined,
	            transformation: object["transformation"],
	            uid: object["uid"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            allowedEventTypes: self.allowedEventTypes,
	            description: self.description,
	            featureFlags: self.featureFlags,
	            instructions: self.instructions,
	            kind: self.kind != null ? connectorKind_1.ConnectorKindSerializer._toJsonObject(self.kind) : undefined,
	            logo: self.logo,
	            name: self.name,
	            productType: self.productType != null
	                ? connectorProduct_1.ConnectorProductSerializer._toJsonObject(self.productType)
	                : undefined,
	            transformation: self.transformation,
	            uid: self.uid,
	        };
	    },
	};
	
	return connectorIn;
}

var connectorOut = {};

var hasRequiredConnectorOut;

function requireConnectorOut () {
	if (hasRequiredConnectorOut) return connectorOut;
	hasRequiredConnectorOut = 1;
	Object.defineProperty(connectorOut, "__esModule", { value: true });
	connectorOut.ConnectorOutSerializer = void 0;
	const connectorKind_1 = requireConnectorKind();
	const connectorProduct_1 = requireConnectorProduct();
	connectorOut.ConnectorOutSerializer = {
	    _fromJsonObject(object) {
	        return {
	            allowedEventTypes: object["allowedEventTypes"],
	            createdAt: new Date(object["createdAt"]),
	            description: object["description"],
	            featureFlags: object["featureFlags"],
	            id: object["id"],
	            instructions: object["instructions"],
	            kind: connectorKind_1.ConnectorKindSerializer._fromJsonObject(object["kind"]),
	            logo: object["logo"],
	            name: object["name"],
	            orgId: object["orgId"],
	            productType: connectorProduct_1.ConnectorProductSerializer._fromJsonObject(object["productType"]),
	            transformation: object["transformation"],
	            transformationUpdatedAt: new Date(object["transformationUpdatedAt"]),
	            uid: object["uid"],
	            updatedAt: new Date(object["updatedAt"]),
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            allowedEventTypes: self.allowedEventTypes,
	            createdAt: self.createdAt,
	            description: self.description,
	            featureFlags: self.featureFlags,
	            id: self.id,
	            instructions: self.instructions,
	            kind: connectorKind_1.ConnectorKindSerializer._toJsonObject(self.kind),
	            logo: self.logo,
	            name: self.name,
	            orgId: self.orgId,
	            productType: connectorProduct_1.ConnectorProductSerializer._toJsonObject(self.productType),
	            transformation: self.transformation,
	            transformationUpdatedAt: self.transformationUpdatedAt,
	            uid: self.uid,
	            updatedAt: self.updatedAt,
	        };
	    },
	};
	
	return connectorOut;
}

var connectorPatch = {};

var hasRequiredConnectorPatch;

function requireConnectorPatch () {
	if (hasRequiredConnectorPatch) return connectorPatch;
	hasRequiredConnectorPatch = 1;
	Object.defineProperty(connectorPatch, "__esModule", { value: true });
	connectorPatch.ConnectorPatchSerializer = void 0;
	const connectorKind_1 = requireConnectorKind();
	connectorPatch.ConnectorPatchSerializer = {
	    _fromJsonObject(object) {
	        return {
	            allowedEventTypes: object["allowedEventTypes"],
	            description: object["description"],
	            featureFlags: object["featureFlags"],
	            instructions: object["instructions"],
	            kind: object["kind"] != null
	                ? connectorKind_1.ConnectorKindSerializer._fromJsonObject(object["kind"])
	                : undefined,
	            logo: object["logo"],
	            name: object["name"],
	            transformation: object["transformation"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            allowedEventTypes: self.allowedEventTypes,
	            description: self.description,
	            featureFlags: self.featureFlags,
	            instructions: self.instructions,
	            kind: self.kind != null ? connectorKind_1.ConnectorKindSerializer._toJsonObject(self.kind) : undefined,
	            logo: self.logo,
	            name: self.name,
	            transformation: self.transformation,
	        };
	    },
	};
	
	return connectorPatch;
}

var connectorUpdate = {};

var hasRequiredConnectorUpdate;

function requireConnectorUpdate () {
	if (hasRequiredConnectorUpdate) return connectorUpdate;
	hasRequiredConnectorUpdate = 1;
	Object.defineProperty(connectorUpdate, "__esModule", { value: true });
	connectorUpdate.ConnectorUpdateSerializer = void 0;
	const connectorKind_1 = requireConnectorKind();
	connectorUpdate.ConnectorUpdateSerializer = {
	    _fromJsonObject(object) {
	        return {
	            allowedEventTypes: object["allowedEventTypes"],
	            description: object["description"],
	            featureFlags: object["featureFlags"],
	            instructions: object["instructions"],
	            kind: object["kind"] != null
	                ? connectorKind_1.ConnectorKindSerializer._fromJsonObject(object["kind"])
	                : undefined,
	            logo: object["logo"],
	            name: object["name"],
	            transformation: object["transformation"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            allowedEventTypes: self.allowedEventTypes,
	            description: self.description,
	            featureFlags: self.featureFlags,
	            instructions: self.instructions,
	            kind: self.kind != null ? connectorKind_1.ConnectorKindSerializer._toJsonObject(self.kind) : undefined,
	            logo: self.logo,
	            name: self.name,
	            transformation: self.transformation,
	        };
	    },
	};
	
	return connectorUpdate;
}

var listResponseConnectorOut = {};

var hasRequiredListResponseConnectorOut;

function requireListResponseConnectorOut () {
	if (hasRequiredListResponseConnectorOut) return listResponseConnectorOut;
	hasRequiredListResponseConnectorOut = 1;
	Object.defineProperty(listResponseConnectorOut, "__esModule", { value: true });
	listResponseConnectorOut.ListResponseConnectorOutSerializer = void 0;
	const connectorOut_1 = requireConnectorOut();
	listResponseConnectorOut.ListResponseConnectorOutSerializer = {
	    _fromJsonObject(object) {
	        return {
	            data: object["data"].map((item) => connectorOut_1.ConnectorOutSerializer._fromJsonObject(item)),
	            done: object["done"],
	            iterator: object["iterator"],
	            prevIterator: object["prevIterator"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            data: self.data.map((item) => connectorOut_1.ConnectorOutSerializer._toJsonObject(item)),
	            done: self.done,
	            iterator: self.iterator,
	            prevIterator: self.prevIterator,
	        };
	    },
	};
	
	return listResponseConnectorOut;
}

var hasRequiredConnector;

function requireConnector () {
	if (hasRequiredConnector) return connector;
	hasRequiredConnector = 1;
	Object.defineProperty(connector, "__esModule", { value: true });
	connector.Connector = void 0;
	const connectorIn_1 = requireConnectorIn();
	const connectorOut_1 = requireConnectorOut();
	const connectorPatch_1 = requireConnectorPatch();
	const connectorUpdate_1 = requireConnectorUpdate();
	const listResponseConnectorOut_1 = requireListResponseConnectorOut();
	const request_1 = requireRequest();
	class Connector {
	    constructor(requestCtx) {
	        this.requestCtx = requestCtx;
	    }
	    list(options) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/connector");
	        request.setQueryParams({
	            limit: options === null || options === void 0 ? void 0 : options.limit,
	            iterator: options === null || options === void 0 ? void 0 : options.iterator,
	            order: options === null || options === void 0 ? void 0 : options.order,
	            product_type: options === null || options === void 0 ? void 0 : options.productType,
	        });
	        return request.send(this.requestCtx, listResponseConnectorOut_1.ListResponseConnectorOutSerializer._fromJsonObject);
	    }
	    create(connectorIn, options) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/connector");
	        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
	        request.setBody(connectorIn_1.ConnectorInSerializer._toJsonObject(connectorIn));
	        return request.send(this.requestCtx, connectorOut_1.ConnectorOutSerializer._fromJsonObject);
	    }
	    get(connectorId) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/connector/{connector_id}");
	        request.setPathParam("connector_id", connectorId);
	        return request.send(this.requestCtx, connectorOut_1.ConnectorOutSerializer._fromJsonObject);
	    }
	    update(connectorId, connectorUpdate) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.PUT, "/api/v1/connector/{connector_id}");
	        request.setPathParam("connector_id", connectorId);
	        request.setBody(connectorUpdate_1.ConnectorUpdateSerializer._toJsonObject(connectorUpdate));
	        return request.send(this.requestCtx, connectorOut_1.ConnectorOutSerializer._fromJsonObject);
	    }
	    delete(connectorId) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.DELETE, "/api/v1/connector/{connector_id}");
	        request.setPathParam("connector_id", connectorId);
	        return request.sendNoResponseBody(this.requestCtx);
	    }
	    patch(connectorId, connectorPatch) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.PATCH, "/api/v1/connector/{connector_id}");
	        request.setPathParam("connector_id", connectorId);
	        request.setBody(connectorPatch_1.ConnectorPatchSerializer._toJsonObject(connectorPatch));
	        return request.send(this.requestCtx, connectorOut_1.ConnectorOutSerializer._fromJsonObject);
	    }
	}
	connector.Connector = Connector;
	
	return connector;
}

var endpoint = {};

var bulkReplayIn = {};

var messageStatus = {};

var hasRequiredMessageStatus;

function requireMessageStatus () {
	if (hasRequiredMessageStatus) return messageStatus;
	hasRequiredMessageStatus = 1;
	(function (exports$1) {
		Object.defineProperty(exports$1, "__esModule", { value: true });
		exports$1.MessageStatusSerializer = exports$1.MessageStatus = void 0;
		(function (MessageStatus) {
		    MessageStatus[MessageStatus["Success"] = 0] = "Success";
		    MessageStatus[MessageStatus["Pending"] = 1] = "Pending";
		    MessageStatus[MessageStatus["Fail"] = 2] = "Fail";
		    MessageStatus[MessageStatus["Sending"] = 3] = "Sending";
		})(exports$1.MessageStatus || (exports$1.MessageStatus = {}));
		exports$1.MessageStatusSerializer = {
		    _fromJsonObject(object) {
		        return object;
		    },
		    _toJsonObject(self) {
		        return self;
		    },
		};
		
	} (messageStatus));
	return messageStatus;
}

var statusCodeClass = {};

var hasRequiredStatusCodeClass;

function requireStatusCodeClass () {
	if (hasRequiredStatusCodeClass) return statusCodeClass;
	hasRequiredStatusCodeClass = 1;
	(function (exports$1) {
		Object.defineProperty(exports$1, "__esModule", { value: true });
		exports$1.StatusCodeClassSerializer = exports$1.StatusCodeClass = void 0;
		(function (StatusCodeClass) {
		    StatusCodeClass[StatusCodeClass["CodeNone"] = 0] = "CodeNone";
		    StatusCodeClass[StatusCodeClass["Code1xx"] = 100] = "Code1xx";
		    StatusCodeClass[StatusCodeClass["Code2xx"] = 200] = "Code2xx";
		    StatusCodeClass[StatusCodeClass["Code3xx"] = 300] = "Code3xx";
		    StatusCodeClass[StatusCodeClass["Code4xx"] = 400] = "Code4xx";
		    StatusCodeClass[StatusCodeClass["Code5xx"] = 500] = "Code5xx";
		})(exports$1.StatusCodeClass || (exports$1.StatusCodeClass = {}));
		exports$1.StatusCodeClassSerializer = {
		    _fromJsonObject(object) {
		        return object;
		    },
		    _toJsonObject(self) {
		        return self;
		    },
		};
		
	} (statusCodeClass));
	return statusCodeClass;
}

var hasRequiredBulkReplayIn;

function requireBulkReplayIn () {
	if (hasRequiredBulkReplayIn) return bulkReplayIn;
	hasRequiredBulkReplayIn = 1;
	Object.defineProperty(bulkReplayIn, "__esModule", { value: true });
	bulkReplayIn.BulkReplayInSerializer = void 0;
	const messageStatus_1 = requireMessageStatus();
	const statusCodeClass_1 = requireStatusCodeClass();
	bulkReplayIn.BulkReplayInSerializer = {
	    _fromJsonObject(object) {
	        return {
	            channel: object["channel"],
	            eventTypes: object["eventTypes"],
	            since: new Date(object["since"]),
	            status: object["status"] != null
	                ? messageStatus_1.MessageStatusSerializer._fromJsonObject(object["status"])
	                : undefined,
	            statusCodeClass: object["statusCodeClass"] != null
	                ? statusCodeClass_1.StatusCodeClassSerializer._fromJsonObject(object["statusCodeClass"])
	                : undefined,
	            tag: object["tag"],
	            until: object["until"] ? new Date(object["until"]) : null,
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            channel: self.channel,
	            eventTypes: self.eventTypes,
	            since: self.since,
	            status: self.status != null
	                ? messageStatus_1.MessageStatusSerializer._toJsonObject(self.status)
	                : undefined,
	            statusCodeClass: self.statusCodeClass != null
	                ? statusCodeClass_1.StatusCodeClassSerializer._toJsonObject(self.statusCodeClass)
	                : undefined,
	            tag: self.tag,
	            until: self.until,
	        };
	    },
	};
	
	return bulkReplayIn;
}

var endpointHeadersIn = {};

var hasRequiredEndpointHeadersIn;

function requireEndpointHeadersIn () {
	if (hasRequiredEndpointHeadersIn) return endpointHeadersIn;
	hasRequiredEndpointHeadersIn = 1;
	Object.defineProperty(endpointHeadersIn, "__esModule", { value: true });
	endpointHeadersIn.EndpointHeadersInSerializer = void 0;
	endpointHeadersIn.EndpointHeadersInSerializer = {
	    _fromJsonObject(object) {
	        return {
	            headers: object["headers"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            headers: self.headers,
	        };
	    },
	};
	
	return endpointHeadersIn;
}

var endpointHeadersOut = {};

var hasRequiredEndpointHeadersOut;

function requireEndpointHeadersOut () {
	if (hasRequiredEndpointHeadersOut) return endpointHeadersOut;
	hasRequiredEndpointHeadersOut = 1;
	Object.defineProperty(endpointHeadersOut, "__esModule", { value: true });
	endpointHeadersOut.EndpointHeadersOutSerializer = void 0;
	endpointHeadersOut.EndpointHeadersOutSerializer = {
	    _fromJsonObject(object) {
	        return {
	            headers: object["headers"],
	            sensitive: object["sensitive"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            headers: self.headers,
	            sensitive: self.sensitive,
	        };
	    },
	};
	
	return endpointHeadersOut;
}

var endpointHeadersPatchIn = {};

var hasRequiredEndpointHeadersPatchIn;

function requireEndpointHeadersPatchIn () {
	if (hasRequiredEndpointHeadersPatchIn) return endpointHeadersPatchIn;
	hasRequiredEndpointHeadersPatchIn = 1;
	Object.defineProperty(endpointHeadersPatchIn, "__esModule", { value: true });
	endpointHeadersPatchIn.EndpointHeadersPatchInSerializer = void 0;
	endpointHeadersPatchIn.EndpointHeadersPatchInSerializer = {
	    _fromJsonObject(object) {
	        return {
	            deleteHeaders: object["deleteHeaders"],
	            headers: object["headers"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            deleteHeaders: self.deleteHeaders,
	            headers: self.headers,
	        };
	    },
	};
	
	return endpointHeadersPatchIn;
}

var endpointIn = {};

var hasRequiredEndpointIn;

function requireEndpointIn () {
	if (hasRequiredEndpointIn) return endpointIn;
	hasRequiredEndpointIn = 1;
	Object.defineProperty(endpointIn, "__esModule", { value: true });
	endpointIn.EndpointInSerializer = void 0;
	endpointIn.EndpointInSerializer = {
	    _fromJsonObject(object) {
	        return {
	            channels: object["channels"],
	            description: object["description"],
	            disabled: object["disabled"],
	            filterTypes: object["filterTypes"],
	            headers: object["headers"],
	            metadata: object["metadata"],
	            rateLimit: object["rateLimit"],
	            secret: object["secret"],
	            throttleRate: object["throttleRate"],
	            uid: object["uid"],
	            url: object["url"],
	            version: object["version"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            channels: self.channels,
	            description: self.description,
	            disabled: self.disabled,
	            filterTypes: self.filterTypes,
	            headers: self.headers,
	            metadata: self.metadata,
	            rateLimit: self.rateLimit,
	            secret: self.secret,
	            throttleRate: self.throttleRate,
	            uid: self.uid,
	            url: self.url,
	            version: self.version,
	        };
	    },
	};
	
	return endpointIn;
}

var endpointOut = {};

var hasRequiredEndpointOut;

function requireEndpointOut () {
	if (hasRequiredEndpointOut) return endpointOut;
	hasRequiredEndpointOut = 1;
	Object.defineProperty(endpointOut, "__esModule", { value: true });
	endpointOut.EndpointOutSerializer = void 0;
	endpointOut.EndpointOutSerializer = {
	    _fromJsonObject(object) {
	        return {
	            channels: object["channels"],
	            createdAt: new Date(object["createdAt"]),
	            description: object["description"],
	            disabled: object["disabled"],
	            filterTypes: object["filterTypes"],
	            id: object["id"],
	            metadata: object["metadata"],
	            rateLimit: object["rateLimit"],
	            throttleRate: object["throttleRate"],
	            uid: object["uid"],
	            updatedAt: new Date(object["updatedAt"]),
	            url: object["url"],
	            version: object["version"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            channels: self.channels,
	            createdAt: self.createdAt,
	            description: self.description,
	            disabled: self.disabled,
	            filterTypes: self.filterTypes,
	            id: self.id,
	            metadata: self.metadata,
	            rateLimit: self.rateLimit,
	            throttleRate: self.throttleRate,
	            uid: self.uid,
	            updatedAt: self.updatedAt,
	            url: self.url,
	            version: self.version,
	        };
	    },
	};
	
	return endpointOut;
}

var endpointPatch = {};

var hasRequiredEndpointPatch;

function requireEndpointPatch () {
	if (hasRequiredEndpointPatch) return endpointPatch;
	hasRequiredEndpointPatch = 1;
	Object.defineProperty(endpointPatch, "__esModule", { value: true });
	endpointPatch.EndpointPatchSerializer = void 0;
	endpointPatch.EndpointPatchSerializer = {
	    _fromJsonObject(object) {
	        return {
	            channels: object["channels"],
	            description: object["description"],
	            disabled: object["disabled"],
	            filterTypes: object["filterTypes"],
	            metadata: object["metadata"],
	            rateLimit: object["rateLimit"],
	            secret: object["secret"],
	            throttleRate: object["throttleRate"],
	            uid: object["uid"],
	            url: object["url"],
	            version: object["version"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            channels: self.channels,
	            description: self.description,
	            disabled: self.disabled,
	            filterTypes: self.filterTypes,
	            metadata: self.metadata,
	            rateLimit: self.rateLimit,
	            secret: self.secret,
	            throttleRate: self.throttleRate,
	            uid: self.uid,
	            url: self.url,
	            version: self.version,
	        };
	    },
	};
	
	return endpointPatch;
}

var endpointSecretOut = {};

var hasRequiredEndpointSecretOut;

function requireEndpointSecretOut () {
	if (hasRequiredEndpointSecretOut) return endpointSecretOut;
	hasRequiredEndpointSecretOut = 1;
	Object.defineProperty(endpointSecretOut, "__esModule", { value: true });
	endpointSecretOut.EndpointSecretOutSerializer = void 0;
	endpointSecretOut.EndpointSecretOutSerializer = {
	    _fromJsonObject(object) {
	        return {
	            key: object["key"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            key: self.key,
	        };
	    },
	};
	
	return endpointSecretOut;
}

var endpointSecretRotateIn = {};

var hasRequiredEndpointSecretRotateIn;

function requireEndpointSecretRotateIn () {
	if (hasRequiredEndpointSecretRotateIn) return endpointSecretRotateIn;
	hasRequiredEndpointSecretRotateIn = 1;
	Object.defineProperty(endpointSecretRotateIn, "__esModule", { value: true });
	endpointSecretRotateIn.EndpointSecretRotateInSerializer = void 0;
	endpointSecretRotateIn.EndpointSecretRotateInSerializer = {
	    _fromJsonObject(object) {
	        return {
	            key: object["key"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            key: self.key,
	        };
	    },
	};
	
	return endpointSecretRotateIn;
}

var endpointStats = {};

var hasRequiredEndpointStats;

function requireEndpointStats () {
	if (hasRequiredEndpointStats) return endpointStats;
	hasRequiredEndpointStats = 1;
	Object.defineProperty(endpointStats, "__esModule", { value: true });
	endpointStats.EndpointStatsSerializer = void 0;
	endpointStats.EndpointStatsSerializer = {
	    _fromJsonObject(object) {
	        return {
	            fail: object["fail"],
	            pending: object["pending"],
	            sending: object["sending"],
	            success: object["success"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            fail: self.fail,
	            pending: self.pending,
	            sending: self.sending,
	            success: self.success,
	        };
	    },
	};
	
	return endpointStats;
}

var endpointTransformationIn = {};

var hasRequiredEndpointTransformationIn;

function requireEndpointTransformationIn () {
	if (hasRequiredEndpointTransformationIn) return endpointTransformationIn;
	hasRequiredEndpointTransformationIn = 1;
	Object.defineProperty(endpointTransformationIn, "__esModule", { value: true });
	endpointTransformationIn.EndpointTransformationInSerializer = void 0;
	endpointTransformationIn.EndpointTransformationInSerializer = {
	    _fromJsonObject(object) {
	        return {
	            code: object["code"],
	            enabled: object["enabled"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            code: self.code,
	            enabled: self.enabled,
	        };
	    },
	};
	
	return endpointTransformationIn;
}

var endpointTransformationOut = {};

var hasRequiredEndpointTransformationOut;

function requireEndpointTransformationOut () {
	if (hasRequiredEndpointTransformationOut) return endpointTransformationOut;
	hasRequiredEndpointTransformationOut = 1;
	Object.defineProperty(endpointTransformationOut, "__esModule", { value: true });
	endpointTransformationOut.EndpointTransformationOutSerializer = void 0;
	endpointTransformationOut.EndpointTransformationOutSerializer = {
	    _fromJsonObject(object) {
	        return {
	            code: object["code"],
	            enabled: object["enabled"],
	            updatedAt: object["updatedAt"] ? new Date(object["updatedAt"]) : null,
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            code: self.code,
	            enabled: self.enabled,
	            updatedAt: self.updatedAt,
	        };
	    },
	};
	
	return endpointTransformationOut;
}

var endpointTransformationPatch = {};

var hasRequiredEndpointTransformationPatch;

function requireEndpointTransformationPatch () {
	if (hasRequiredEndpointTransformationPatch) return endpointTransformationPatch;
	hasRequiredEndpointTransformationPatch = 1;
	Object.defineProperty(endpointTransformationPatch, "__esModule", { value: true });
	endpointTransformationPatch.EndpointTransformationPatchSerializer = void 0;
	endpointTransformationPatch.EndpointTransformationPatchSerializer = {
	    _fromJsonObject(object) {
	        return {
	            code: object["code"],
	            enabled: object["enabled"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            code: self.code,
	            enabled: self.enabled,
	        };
	    },
	};
	
	return endpointTransformationPatch;
}

var endpointUpdate = {};

var hasRequiredEndpointUpdate;

function requireEndpointUpdate () {
	if (hasRequiredEndpointUpdate) return endpointUpdate;
	hasRequiredEndpointUpdate = 1;
	Object.defineProperty(endpointUpdate, "__esModule", { value: true });
	endpointUpdate.EndpointUpdateSerializer = void 0;
	endpointUpdate.EndpointUpdateSerializer = {
	    _fromJsonObject(object) {
	        return {
	            channels: object["channels"],
	            description: object["description"],
	            disabled: object["disabled"],
	            filterTypes: object["filterTypes"],
	            metadata: object["metadata"],
	            rateLimit: object["rateLimit"],
	            throttleRate: object["throttleRate"],
	            uid: object["uid"],
	            url: object["url"],
	            version: object["version"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            channels: self.channels,
	            description: self.description,
	            disabled: self.disabled,
	            filterTypes: self.filterTypes,
	            metadata: self.metadata,
	            rateLimit: self.rateLimit,
	            throttleRate: self.throttleRate,
	            uid: self.uid,
	            url: self.url,
	            version: self.version,
	        };
	    },
	};
	
	return endpointUpdate;
}

var eventExampleIn = {};

var hasRequiredEventExampleIn;

function requireEventExampleIn () {
	if (hasRequiredEventExampleIn) return eventExampleIn;
	hasRequiredEventExampleIn = 1;
	Object.defineProperty(eventExampleIn, "__esModule", { value: true });
	eventExampleIn.EventExampleInSerializer = void 0;
	eventExampleIn.EventExampleInSerializer = {
	    _fromJsonObject(object) {
	        return {
	            eventType: object["eventType"],
	            exampleIndex: object["exampleIndex"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            eventType: self.eventType,
	            exampleIndex: self.exampleIndex,
	        };
	    },
	};
	
	return eventExampleIn;
}

var listResponseEndpointOut = {};

var hasRequiredListResponseEndpointOut;

function requireListResponseEndpointOut () {
	if (hasRequiredListResponseEndpointOut) return listResponseEndpointOut;
	hasRequiredListResponseEndpointOut = 1;
	Object.defineProperty(listResponseEndpointOut, "__esModule", { value: true });
	listResponseEndpointOut.ListResponseEndpointOutSerializer = void 0;
	const endpointOut_1 = requireEndpointOut();
	listResponseEndpointOut.ListResponseEndpointOutSerializer = {
	    _fromJsonObject(object) {
	        return {
	            data: object["data"].map((item) => endpointOut_1.EndpointOutSerializer._fromJsonObject(item)),
	            done: object["done"],
	            iterator: object["iterator"],
	            prevIterator: object["prevIterator"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            data: self.data.map((item) => endpointOut_1.EndpointOutSerializer._toJsonObject(item)),
	            done: self.done,
	            iterator: self.iterator,
	            prevIterator: self.prevIterator,
	        };
	    },
	};
	
	return listResponseEndpointOut;
}

var messageOut = {};

var hasRequiredMessageOut;

function requireMessageOut () {
	if (hasRequiredMessageOut) return messageOut;
	hasRequiredMessageOut = 1;
	Object.defineProperty(messageOut, "__esModule", { value: true });
	messageOut.MessageOutSerializer = void 0;
	messageOut.MessageOutSerializer = {
	    _fromJsonObject(object) {
	        return {
	            channels: object["channels"],
	            deliverAt: object["deliverAt"] ? new Date(object["deliverAt"]) : null,
	            eventId: object["eventId"],
	            eventType: object["eventType"],
	            id: object["id"],
	            payload: object["payload"],
	            tags: object["tags"],
	            timestamp: new Date(object["timestamp"]),
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            channels: self.channels,
	            deliverAt: self.deliverAt,
	            eventId: self.eventId,
	            eventType: self.eventType,
	            id: self.id,
	            payload: self.payload,
	            tags: self.tags,
	            timestamp: self.timestamp,
	        };
	    },
	};
	
	return messageOut;
}

var recoverIn = {};

var hasRequiredRecoverIn;

function requireRecoverIn () {
	if (hasRequiredRecoverIn) return recoverIn;
	hasRequiredRecoverIn = 1;
	Object.defineProperty(recoverIn, "__esModule", { value: true });
	recoverIn.RecoverInSerializer = void 0;
	recoverIn.RecoverInSerializer = {
	    _fromJsonObject(object) {
	        return {
	            since: new Date(object["since"]),
	            until: object["until"] ? new Date(object["until"]) : null,
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            since: self.since,
	            until: self.until,
	        };
	    },
	};
	
	return recoverIn;
}

var recoverOut = {};

var hasRequiredRecoverOut;

function requireRecoverOut () {
	if (hasRequiredRecoverOut) return recoverOut;
	hasRequiredRecoverOut = 1;
	Object.defineProperty(recoverOut, "__esModule", { value: true });
	recoverOut.RecoverOutSerializer = void 0;
	const backgroundTaskStatus_1 = requireBackgroundTaskStatus();
	const backgroundTaskType_1 = requireBackgroundTaskType();
	recoverOut.RecoverOutSerializer = {
	    _fromJsonObject(object) {
	        return {
	            id: object["id"],
	            status: backgroundTaskStatus_1.BackgroundTaskStatusSerializer._fromJsonObject(object["status"]),
	            task: backgroundTaskType_1.BackgroundTaskTypeSerializer._fromJsonObject(object["task"]),
	            updatedAt: new Date(object["updatedAt"]),
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            id: self.id,
	            status: backgroundTaskStatus_1.BackgroundTaskStatusSerializer._toJsonObject(self.status),
	            task: backgroundTaskType_1.BackgroundTaskTypeSerializer._toJsonObject(self.task),
	            updatedAt: self.updatedAt,
	        };
	    },
	};
	
	return recoverOut;
}

var replayIn = {};

var hasRequiredReplayIn;

function requireReplayIn () {
	if (hasRequiredReplayIn) return replayIn;
	hasRequiredReplayIn = 1;
	Object.defineProperty(replayIn, "__esModule", { value: true });
	replayIn.ReplayInSerializer = void 0;
	replayIn.ReplayInSerializer = {
	    _fromJsonObject(object) {
	        return {
	            since: new Date(object["since"]),
	            until: object["until"] ? new Date(object["until"]) : null,
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            since: self.since,
	            until: self.until,
	        };
	    },
	};
	
	return replayIn;
}

var replayOut = {};

var hasRequiredReplayOut;

function requireReplayOut () {
	if (hasRequiredReplayOut) return replayOut;
	hasRequiredReplayOut = 1;
	Object.defineProperty(replayOut, "__esModule", { value: true });
	replayOut.ReplayOutSerializer = void 0;
	const backgroundTaskStatus_1 = requireBackgroundTaskStatus();
	const backgroundTaskType_1 = requireBackgroundTaskType();
	replayOut.ReplayOutSerializer = {
	    _fromJsonObject(object) {
	        return {
	            id: object["id"],
	            status: backgroundTaskStatus_1.BackgroundTaskStatusSerializer._fromJsonObject(object["status"]),
	            task: backgroundTaskType_1.BackgroundTaskTypeSerializer._fromJsonObject(object["task"]),
	            updatedAt: new Date(object["updatedAt"]),
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            id: self.id,
	            status: backgroundTaskStatus_1.BackgroundTaskStatusSerializer._toJsonObject(self.status),
	            task: backgroundTaskType_1.BackgroundTaskTypeSerializer._toJsonObject(self.task),
	            updatedAt: self.updatedAt,
	        };
	    },
	};
	
	return replayOut;
}

var hasRequiredEndpoint;

function requireEndpoint () {
	if (hasRequiredEndpoint) return endpoint;
	hasRequiredEndpoint = 1;
	Object.defineProperty(endpoint, "__esModule", { value: true });
	endpoint.Endpoint = void 0;
	const bulkReplayIn_1 = requireBulkReplayIn();
	const endpointHeadersIn_1 = requireEndpointHeadersIn();
	const endpointHeadersOut_1 = requireEndpointHeadersOut();
	const endpointHeadersPatchIn_1 = requireEndpointHeadersPatchIn();
	const endpointIn_1 = requireEndpointIn();
	const endpointOut_1 = requireEndpointOut();
	const endpointPatch_1 = requireEndpointPatch();
	const endpointSecretOut_1 = requireEndpointSecretOut();
	const endpointSecretRotateIn_1 = requireEndpointSecretRotateIn();
	const endpointStats_1 = requireEndpointStats();
	const endpointTransformationIn_1 = requireEndpointTransformationIn();
	const endpointTransformationOut_1 = requireEndpointTransformationOut();
	const endpointTransformationPatch_1 = requireEndpointTransformationPatch();
	const endpointUpdate_1 = requireEndpointUpdate();
	const eventExampleIn_1 = requireEventExampleIn();
	const listResponseEndpointOut_1 = requireListResponseEndpointOut();
	const messageOut_1 = requireMessageOut();
	const recoverIn_1 = requireRecoverIn();
	const recoverOut_1 = requireRecoverOut();
	const replayIn_1 = requireReplayIn();
	const replayOut_1 = requireReplayOut();
	const request_1 = requireRequest();
	class Endpoint {
	    constructor(requestCtx) {
	        this.requestCtx = requestCtx;
	    }
	    list(appId, options) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/app/{app_id}/endpoint");
	        request.setPathParam("app_id", appId);
	        request.setQueryParams({
	            limit: options === null || options === void 0 ? void 0 : options.limit,
	            iterator: options === null || options === void 0 ? void 0 : options.iterator,
	            order: options === null || options === void 0 ? void 0 : options.order,
	        });
	        return request.send(this.requestCtx, listResponseEndpointOut_1.ListResponseEndpointOutSerializer._fromJsonObject);
	    }
	    create(appId, endpointIn, options) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/app/{app_id}/endpoint");
	        request.setPathParam("app_id", appId);
	        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
	        request.setBody(endpointIn_1.EndpointInSerializer._toJsonObject(endpointIn));
	        return request.send(this.requestCtx, endpointOut_1.EndpointOutSerializer._fromJsonObject);
	    }
	    get(appId, endpointId) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/app/{app_id}/endpoint/{endpoint_id}");
	        request.setPathParam("app_id", appId);
	        request.setPathParam("endpoint_id", endpointId);
	        return request.send(this.requestCtx, endpointOut_1.EndpointOutSerializer._fromJsonObject);
	    }
	    update(appId, endpointId, endpointUpdate) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.PUT, "/api/v1/app/{app_id}/endpoint/{endpoint_id}");
	        request.setPathParam("app_id", appId);
	        request.setPathParam("endpoint_id", endpointId);
	        request.setBody(endpointUpdate_1.EndpointUpdateSerializer._toJsonObject(endpointUpdate));
	        return request.send(this.requestCtx, endpointOut_1.EndpointOutSerializer._fromJsonObject);
	    }
	    delete(appId, endpointId) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.DELETE, "/api/v1/app/{app_id}/endpoint/{endpoint_id}");
	        request.setPathParam("app_id", appId);
	        request.setPathParam("endpoint_id", endpointId);
	        return request.sendNoResponseBody(this.requestCtx);
	    }
	    patch(appId, endpointId, endpointPatch) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.PATCH, "/api/v1/app/{app_id}/endpoint/{endpoint_id}");
	        request.setPathParam("app_id", appId);
	        request.setPathParam("endpoint_id", endpointId);
	        request.setBody(endpointPatch_1.EndpointPatchSerializer._toJsonObject(endpointPatch));
	        return request.send(this.requestCtx, endpointOut_1.EndpointOutSerializer._fromJsonObject);
	    }
	    bulkReplay(appId, endpointId, bulkReplayIn, options) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/app/{app_id}/endpoint/{endpoint_id}/bulk-replay");
	        request.setPathParam("app_id", appId);
	        request.setPathParam("endpoint_id", endpointId);
	        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
	        request.setBody(bulkReplayIn_1.BulkReplayInSerializer._toJsonObject(bulkReplayIn));
	        return request.send(this.requestCtx, replayOut_1.ReplayOutSerializer._fromJsonObject);
	    }
	    getHeaders(appId, endpointId) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/app/{app_id}/endpoint/{endpoint_id}/headers");
	        request.setPathParam("app_id", appId);
	        request.setPathParam("endpoint_id", endpointId);
	        return request.send(this.requestCtx, endpointHeadersOut_1.EndpointHeadersOutSerializer._fromJsonObject);
	    }
	    updateHeaders(appId, endpointId, endpointHeadersIn) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.PUT, "/api/v1/app/{app_id}/endpoint/{endpoint_id}/headers");
	        request.setPathParam("app_id", appId);
	        request.setPathParam("endpoint_id", endpointId);
	        request.setBody(endpointHeadersIn_1.EndpointHeadersInSerializer._toJsonObject(endpointHeadersIn));
	        return request.sendNoResponseBody(this.requestCtx);
	    }
	    headersUpdate(appId, endpointId, endpointHeadersIn) {
	        return this.updateHeaders(appId, endpointId, endpointHeadersIn);
	    }
	    patchHeaders(appId, endpointId, endpointHeadersPatchIn) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.PATCH, "/api/v1/app/{app_id}/endpoint/{endpoint_id}/headers");
	        request.setPathParam("app_id", appId);
	        request.setPathParam("endpoint_id", endpointId);
	        request.setBody(endpointHeadersPatchIn_1.EndpointHeadersPatchInSerializer._toJsonObject(endpointHeadersPatchIn));
	        return request.sendNoResponseBody(this.requestCtx);
	    }
	    headersPatch(appId, endpointId, endpointHeadersPatchIn) {
	        return this.patchHeaders(appId, endpointId, endpointHeadersPatchIn);
	    }
	    recover(appId, endpointId, recoverIn, options) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/app/{app_id}/endpoint/{endpoint_id}/recover");
	        request.setPathParam("app_id", appId);
	        request.setPathParam("endpoint_id", endpointId);
	        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
	        request.setBody(recoverIn_1.RecoverInSerializer._toJsonObject(recoverIn));
	        return request.send(this.requestCtx, recoverOut_1.RecoverOutSerializer._fromJsonObject);
	    }
	    replayMissing(appId, endpointId, replayIn, options) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/app/{app_id}/endpoint/{endpoint_id}/replay-missing");
	        request.setPathParam("app_id", appId);
	        request.setPathParam("endpoint_id", endpointId);
	        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
	        request.setBody(replayIn_1.ReplayInSerializer._toJsonObject(replayIn));
	        return request.send(this.requestCtx, replayOut_1.ReplayOutSerializer._fromJsonObject);
	    }
	    getSecret(appId, endpointId) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/app/{app_id}/endpoint/{endpoint_id}/secret");
	        request.setPathParam("app_id", appId);
	        request.setPathParam("endpoint_id", endpointId);
	        return request.send(this.requestCtx, endpointSecretOut_1.EndpointSecretOutSerializer._fromJsonObject);
	    }
	    rotateSecret(appId, endpointId, endpointSecretRotateIn, options) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/app/{app_id}/endpoint/{endpoint_id}/secret/rotate");
	        request.setPathParam("app_id", appId);
	        request.setPathParam("endpoint_id", endpointId);
	        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
	        request.setBody(endpointSecretRotateIn_1.EndpointSecretRotateInSerializer._toJsonObject(endpointSecretRotateIn));
	        return request.sendNoResponseBody(this.requestCtx);
	    }
	    sendExample(appId, endpointId, eventExampleIn, options) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/app/{app_id}/endpoint/{endpoint_id}/send-example");
	        request.setPathParam("app_id", appId);
	        request.setPathParam("endpoint_id", endpointId);
	        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
	        request.setBody(eventExampleIn_1.EventExampleInSerializer._toJsonObject(eventExampleIn));
	        return request.send(this.requestCtx, messageOut_1.MessageOutSerializer._fromJsonObject);
	    }
	    getStats(appId, endpointId, options) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/app/{app_id}/endpoint/{endpoint_id}/stats");
	        request.setPathParam("app_id", appId);
	        request.setPathParam("endpoint_id", endpointId);
	        request.setQueryParams({
	            since: options === null || options === void 0 ? void 0 : options.since,
	            until: options === null || options === void 0 ? void 0 : options.until,
	        });
	        return request.send(this.requestCtx, endpointStats_1.EndpointStatsSerializer._fromJsonObject);
	    }
	    transformationGet(appId, endpointId) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/app/{app_id}/endpoint/{endpoint_id}/transformation");
	        request.setPathParam("app_id", appId);
	        request.setPathParam("endpoint_id", endpointId);
	        return request.send(this.requestCtx, endpointTransformationOut_1.EndpointTransformationOutSerializer._fromJsonObject);
	    }
	    patchTransformation(appId, endpointId, endpointTransformationPatch) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.PATCH, "/api/v1/app/{app_id}/endpoint/{endpoint_id}/transformation");
	        request.setPathParam("app_id", appId);
	        request.setPathParam("endpoint_id", endpointId);
	        request.setBody(endpointTransformationPatch_1.EndpointTransformationPatchSerializer._toJsonObject(endpointTransformationPatch));
	        return request.sendNoResponseBody(this.requestCtx);
	    }
	    transformationPartialUpdate(appId, endpointId, endpointTransformationIn) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.PATCH, "/api/v1/app/{app_id}/endpoint/{endpoint_id}/transformation");
	        request.setPathParam("app_id", appId);
	        request.setPathParam("endpoint_id", endpointId);
	        request.setBody(endpointTransformationIn_1.EndpointTransformationInSerializer._toJsonObject(endpointTransformationIn));
	        return request.sendNoResponseBody(this.requestCtx);
	    }
	}
	endpoint.Endpoint = Endpoint;
	
	return endpoint;
}

var environment = {};

var environmentIn = {};

var eventTypeIn = {};

var hasRequiredEventTypeIn;

function requireEventTypeIn () {
	if (hasRequiredEventTypeIn) return eventTypeIn;
	hasRequiredEventTypeIn = 1;
	Object.defineProperty(eventTypeIn, "__esModule", { value: true });
	eventTypeIn.EventTypeInSerializer = void 0;
	eventTypeIn.EventTypeInSerializer = {
	    _fromJsonObject(object) {
	        return {
	            archived: object["archived"],
	            deprecated: object["deprecated"],
	            description: object["description"],
	            featureFlag: object["featureFlag"],
	            featureFlags: object["featureFlags"],
	            groupName: object["groupName"],
	            name: object["name"],
	            schemas: object["schemas"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            archived: self.archived,
	            deprecated: self.deprecated,
	            description: self.description,
	            featureFlag: self.featureFlag,
	            featureFlags: self.featureFlags,
	            groupName: self.groupName,
	            name: self.name,
	            schemas: self.schemas,
	        };
	    },
	};
	
	return eventTypeIn;
}

var hasRequiredEnvironmentIn;

function requireEnvironmentIn () {
	if (hasRequiredEnvironmentIn) return environmentIn;
	hasRequiredEnvironmentIn = 1;
	Object.defineProperty(environmentIn, "__esModule", { value: true });
	environmentIn.EnvironmentInSerializer = void 0;
	const connectorIn_1 = requireConnectorIn();
	const eventTypeIn_1 = requireEventTypeIn();
	environmentIn.EnvironmentInSerializer = {
	    _fromJsonObject(object) {
	        var _a, _b;
	        return {
	            connectors: (_a = object["connectors"]) === null || _a === void 0 ? void 0 : _a.map((item) => connectorIn_1.ConnectorInSerializer._fromJsonObject(item)),
	            eventTypes: (_b = object["eventTypes"]) === null || _b === void 0 ? void 0 : _b.map((item) => eventTypeIn_1.EventTypeInSerializer._fromJsonObject(item)),
	            settings: object["settings"],
	        };
	    },
	    _toJsonObject(self) {
	        var _a, _b;
	        return {
	            connectors: (_a = self.connectors) === null || _a === void 0 ? void 0 : _a.map((item) => connectorIn_1.ConnectorInSerializer._toJsonObject(item)),
	            eventTypes: (_b = self.eventTypes) === null || _b === void 0 ? void 0 : _b.map((item) => eventTypeIn_1.EventTypeInSerializer._toJsonObject(item)),
	            settings: self.settings,
	        };
	    },
	};
	
	return environmentIn;
}

var environmentOut = {};

var eventTypeOut = {};

var hasRequiredEventTypeOut;

function requireEventTypeOut () {
	if (hasRequiredEventTypeOut) return eventTypeOut;
	hasRequiredEventTypeOut = 1;
	Object.defineProperty(eventTypeOut, "__esModule", { value: true });
	eventTypeOut.EventTypeOutSerializer = void 0;
	eventTypeOut.EventTypeOutSerializer = {
	    _fromJsonObject(object) {
	        return {
	            archived: object["archived"],
	            createdAt: new Date(object["createdAt"]),
	            deprecated: object["deprecated"],
	            description: object["description"],
	            featureFlag: object["featureFlag"],
	            featureFlags: object["featureFlags"],
	            groupName: object["groupName"],
	            name: object["name"],
	            schemas: object["schemas"],
	            updatedAt: new Date(object["updatedAt"]),
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            archived: self.archived,
	            createdAt: self.createdAt,
	            deprecated: self.deprecated,
	            description: self.description,
	            featureFlag: self.featureFlag,
	            featureFlags: self.featureFlags,
	            groupName: self.groupName,
	            name: self.name,
	            schemas: self.schemas,
	            updatedAt: self.updatedAt,
	        };
	    },
	};
	
	return eventTypeOut;
}

var hasRequiredEnvironmentOut;

function requireEnvironmentOut () {
	if (hasRequiredEnvironmentOut) return environmentOut;
	hasRequiredEnvironmentOut = 1;
	Object.defineProperty(environmentOut, "__esModule", { value: true });
	environmentOut.EnvironmentOutSerializer = void 0;
	const connectorOut_1 = requireConnectorOut();
	const eventTypeOut_1 = requireEventTypeOut();
	environmentOut.EnvironmentOutSerializer = {
	    _fromJsonObject(object) {
	        return {
	            connectors: object["connectors"].map((item) => connectorOut_1.ConnectorOutSerializer._fromJsonObject(item)),
	            createdAt: new Date(object["createdAt"]),
	            eventTypes: object["eventTypes"].map((item) => eventTypeOut_1.EventTypeOutSerializer._fromJsonObject(item)),
	            settings: object["settings"],
	            version: object["version"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            connectors: self.connectors.map((item) => connectorOut_1.ConnectorOutSerializer._toJsonObject(item)),
	            createdAt: self.createdAt,
	            eventTypes: self.eventTypes.map((item) => eventTypeOut_1.EventTypeOutSerializer._toJsonObject(item)),
	            settings: self.settings,
	            version: self.version,
	        };
	    },
	};
	
	return environmentOut;
}

var hasRequiredEnvironment;

function requireEnvironment () {
	if (hasRequiredEnvironment) return environment;
	hasRequiredEnvironment = 1;
	Object.defineProperty(environment, "__esModule", { value: true });
	environment.Environment = void 0;
	const environmentIn_1 = requireEnvironmentIn();
	const environmentOut_1 = requireEnvironmentOut();
	const request_1 = requireRequest();
	class Environment {
	    constructor(requestCtx) {
	        this.requestCtx = requestCtx;
	    }
	    export(options) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/environment/export");
	        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
	        return request.send(this.requestCtx, environmentOut_1.EnvironmentOutSerializer._fromJsonObject);
	    }
	    import(environmentIn, options) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/environment/import");
	        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
	        request.setBody(environmentIn_1.EnvironmentInSerializer._toJsonObject(environmentIn));
	        return request.sendNoResponseBody(this.requestCtx);
	    }
	}
	environment.Environment = Environment;
	
	return environment;
}

var eventType = {};

var eventTypeImportOpenApiIn = {};

var hasRequiredEventTypeImportOpenApiIn;

function requireEventTypeImportOpenApiIn () {
	if (hasRequiredEventTypeImportOpenApiIn) return eventTypeImportOpenApiIn;
	hasRequiredEventTypeImportOpenApiIn = 1;
	Object.defineProperty(eventTypeImportOpenApiIn, "__esModule", { value: true });
	eventTypeImportOpenApiIn.EventTypeImportOpenApiInSerializer = void 0;
	eventTypeImportOpenApiIn.EventTypeImportOpenApiInSerializer = {
	    _fromJsonObject(object) {
	        return {
	            dryRun: object["dryRun"],
	            replaceAll: object["replaceAll"],
	            spec: object["spec"],
	            specRaw: object["specRaw"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            dryRun: self.dryRun,
	            replaceAll: self.replaceAll,
	            spec: self.spec,
	            specRaw: self.specRaw,
	        };
	    },
	};
	
	return eventTypeImportOpenApiIn;
}

var eventTypeImportOpenApiOut = {};

var eventTypeImportOpenApiOutData = {};

var eventTypeFromOpenApi = {};

var hasRequiredEventTypeFromOpenApi;

function requireEventTypeFromOpenApi () {
	if (hasRequiredEventTypeFromOpenApi) return eventTypeFromOpenApi;
	hasRequiredEventTypeFromOpenApi = 1;
	Object.defineProperty(eventTypeFromOpenApi, "__esModule", { value: true });
	eventTypeFromOpenApi.EventTypeFromOpenApiSerializer = void 0;
	eventTypeFromOpenApi.EventTypeFromOpenApiSerializer = {
	    _fromJsonObject(object) {
	        return {
	            deprecated: object["deprecated"],
	            description: object["description"],
	            featureFlag: object["featureFlag"],
	            featureFlags: object["featureFlags"],
	            groupName: object["groupName"],
	            name: object["name"],
	            schemas: object["schemas"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            deprecated: self.deprecated,
	            description: self.description,
	            featureFlag: self.featureFlag,
	            featureFlags: self.featureFlags,
	            groupName: self.groupName,
	            name: self.name,
	            schemas: self.schemas,
	        };
	    },
	};
	
	return eventTypeFromOpenApi;
}

var hasRequiredEventTypeImportOpenApiOutData;

function requireEventTypeImportOpenApiOutData () {
	if (hasRequiredEventTypeImportOpenApiOutData) return eventTypeImportOpenApiOutData;
	hasRequiredEventTypeImportOpenApiOutData = 1;
	Object.defineProperty(eventTypeImportOpenApiOutData, "__esModule", { value: true });
	eventTypeImportOpenApiOutData.EventTypeImportOpenApiOutDataSerializer = void 0;
	const eventTypeFromOpenApi_1 = requireEventTypeFromOpenApi();
	eventTypeImportOpenApiOutData.EventTypeImportOpenApiOutDataSerializer = {
	    _fromJsonObject(object) {
	        var _a;
	        return {
	            modified: object["modified"],
	            toModify: (_a = object["to_modify"]) === null || _a === void 0 ? void 0 : _a.map((item) => eventTypeFromOpenApi_1.EventTypeFromOpenApiSerializer._fromJsonObject(item)),
	        };
	    },
	    _toJsonObject(self) {
	        var _a;
	        return {
	            modified: self.modified,
	            to_modify: (_a = self.toModify) === null || _a === void 0 ? void 0 : _a.map((item) => eventTypeFromOpenApi_1.EventTypeFromOpenApiSerializer._toJsonObject(item)),
	        };
	    },
	};
	
	return eventTypeImportOpenApiOutData;
}

var hasRequiredEventTypeImportOpenApiOut;

function requireEventTypeImportOpenApiOut () {
	if (hasRequiredEventTypeImportOpenApiOut) return eventTypeImportOpenApiOut;
	hasRequiredEventTypeImportOpenApiOut = 1;
	Object.defineProperty(eventTypeImportOpenApiOut, "__esModule", { value: true });
	eventTypeImportOpenApiOut.EventTypeImportOpenApiOutSerializer = void 0;
	const eventTypeImportOpenApiOutData_1 = requireEventTypeImportOpenApiOutData();
	eventTypeImportOpenApiOut.EventTypeImportOpenApiOutSerializer = {
	    _fromJsonObject(object) {
	        return {
	            data: eventTypeImportOpenApiOutData_1.EventTypeImportOpenApiOutDataSerializer._fromJsonObject(object["data"]),
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            data: eventTypeImportOpenApiOutData_1.EventTypeImportOpenApiOutDataSerializer._toJsonObject(self.data),
	        };
	    },
	};
	
	return eventTypeImportOpenApiOut;
}

var eventTypePatch = {};

var hasRequiredEventTypePatch;

function requireEventTypePatch () {
	if (hasRequiredEventTypePatch) return eventTypePatch;
	hasRequiredEventTypePatch = 1;
	Object.defineProperty(eventTypePatch, "__esModule", { value: true });
	eventTypePatch.EventTypePatchSerializer = void 0;
	eventTypePatch.EventTypePatchSerializer = {
	    _fromJsonObject(object) {
	        return {
	            archived: object["archived"],
	            deprecated: object["deprecated"],
	            description: object["description"],
	            featureFlag: object["featureFlag"],
	            featureFlags: object["featureFlags"],
	            groupName: object["groupName"],
	            schemas: object["schemas"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            archived: self.archived,
	            deprecated: self.deprecated,
	            description: self.description,
	            featureFlag: self.featureFlag,
	            featureFlags: self.featureFlags,
	            groupName: self.groupName,
	            schemas: self.schemas,
	        };
	    },
	};
	
	return eventTypePatch;
}

var eventTypeUpdate = {};

var hasRequiredEventTypeUpdate;

function requireEventTypeUpdate () {
	if (hasRequiredEventTypeUpdate) return eventTypeUpdate;
	hasRequiredEventTypeUpdate = 1;
	Object.defineProperty(eventTypeUpdate, "__esModule", { value: true });
	eventTypeUpdate.EventTypeUpdateSerializer = void 0;
	eventTypeUpdate.EventTypeUpdateSerializer = {
	    _fromJsonObject(object) {
	        return {
	            archived: object["archived"],
	            deprecated: object["deprecated"],
	            description: object["description"],
	            featureFlag: object["featureFlag"],
	            featureFlags: object["featureFlags"],
	            groupName: object["groupName"],
	            schemas: object["schemas"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            archived: self.archived,
	            deprecated: self.deprecated,
	            description: self.description,
	            featureFlag: self.featureFlag,
	            featureFlags: self.featureFlags,
	            groupName: self.groupName,
	            schemas: self.schemas,
	        };
	    },
	};
	
	return eventTypeUpdate;
}

var listResponseEventTypeOut = {};

var hasRequiredListResponseEventTypeOut;

function requireListResponseEventTypeOut () {
	if (hasRequiredListResponseEventTypeOut) return listResponseEventTypeOut;
	hasRequiredListResponseEventTypeOut = 1;
	Object.defineProperty(listResponseEventTypeOut, "__esModule", { value: true });
	listResponseEventTypeOut.ListResponseEventTypeOutSerializer = void 0;
	const eventTypeOut_1 = requireEventTypeOut();
	listResponseEventTypeOut.ListResponseEventTypeOutSerializer = {
	    _fromJsonObject(object) {
	        return {
	            data: object["data"].map((item) => eventTypeOut_1.EventTypeOutSerializer._fromJsonObject(item)),
	            done: object["done"],
	            iterator: object["iterator"],
	            prevIterator: object["prevIterator"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            data: self.data.map((item) => eventTypeOut_1.EventTypeOutSerializer._toJsonObject(item)),
	            done: self.done,
	            iterator: self.iterator,
	            prevIterator: self.prevIterator,
	        };
	    },
	};
	
	return listResponseEventTypeOut;
}

var hasRequiredEventType;

function requireEventType () {
	if (hasRequiredEventType) return eventType;
	hasRequiredEventType = 1;
	Object.defineProperty(eventType, "__esModule", { value: true });
	eventType.EventType = void 0;
	const eventTypeImportOpenApiIn_1 = requireEventTypeImportOpenApiIn();
	const eventTypeImportOpenApiOut_1 = requireEventTypeImportOpenApiOut();
	const eventTypeIn_1 = requireEventTypeIn();
	const eventTypeOut_1 = requireEventTypeOut();
	const eventTypePatch_1 = requireEventTypePatch();
	const eventTypeUpdate_1 = requireEventTypeUpdate();
	const listResponseEventTypeOut_1 = requireListResponseEventTypeOut();
	const request_1 = requireRequest();
	class EventType {
	    constructor(requestCtx) {
	        this.requestCtx = requestCtx;
	    }
	    list(options) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/event-type");
	        request.setQueryParams({
	            limit: options === null || options === void 0 ? void 0 : options.limit,
	            iterator: options === null || options === void 0 ? void 0 : options.iterator,
	            order: options === null || options === void 0 ? void 0 : options.order,
	            include_archived: options === null || options === void 0 ? void 0 : options.includeArchived,
	            with_content: options === null || options === void 0 ? void 0 : options.withContent,
	        });
	        return request.send(this.requestCtx, listResponseEventTypeOut_1.ListResponseEventTypeOutSerializer._fromJsonObject);
	    }
	    create(eventTypeIn, options) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/event-type");
	        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
	        request.setBody(eventTypeIn_1.EventTypeInSerializer._toJsonObject(eventTypeIn));
	        return request.send(this.requestCtx, eventTypeOut_1.EventTypeOutSerializer._fromJsonObject);
	    }
	    importOpenapi(eventTypeImportOpenApiIn, options) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/event-type/import/openapi");
	        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
	        request.setBody(eventTypeImportOpenApiIn_1.EventTypeImportOpenApiInSerializer._toJsonObject(eventTypeImportOpenApiIn));
	        return request.send(this.requestCtx, eventTypeImportOpenApiOut_1.EventTypeImportOpenApiOutSerializer._fromJsonObject);
	    }
	    get(eventTypeName) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/event-type/{event_type_name}");
	        request.setPathParam("event_type_name", eventTypeName);
	        return request.send(this.requestCtx, eventTypeOut_1.EventTypeOutSerializer._fromJsonObject);
	    }
	    update(eventTypeName, eventTypeUpdate) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.PUT, "/api/v1/event-type/{event_type_name}");
	        request.setPathParam("event_type_name", eventTypeName);
	        request.setBody(eventTypeUpdate_1.EventTypeUpdateSerializer._toJsonObject(eventTypeUpdate));
	        return request.send(this.requestCtx, eventTypeOut_1.EventTypeOutSerializer._fromJsonObject);
	    }
	    delete(eventTypeName, options) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.DELETE, "/api/v1/event-type/{event_type_name}");
	        request.setPathParam("event_type_name", eventTypeName);
	        request.setQueryParams({
	            expunge: options === null || options === void 0 ? void 0 : options.expunge,
	        });
	        return request.sendNoResponseBody(this.requestCtx);
	    }
	    patch(eventTypeName, eventTypePatch) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.PATCH, "/api/v1/event-type/{event_type_name}");
	        request.setPathParam("event_type_name", eventTypeName);
	        request.setBody(eventTypePatch_1.EventTypePatchSerializer._toJsonObject(eventTypePatch));
	        return request.send(this.requestCtx, eventTypeOut_1.EventTypeOutSerializer._fromJsonObject);
	    }
	}
	eventType.EventType = EventType;
	
	return eventType;
}

var health = {};

var hasRequiredHealth;

function requireHealth () {
	if (hasRequiredHealth) return health;
	hasRequiredHealth = 1;
	Object.defineProperty(health, "__esModule", { value: true });
	health.Health = void 0;
	const request_1 = requireRequest();
	class Health {
	    constructor(requestCtx) {
	        this.requestCtx = requestCtx;
	    }
	    get() {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/health");
	        return request.sendNoResponseBody(this.requestCtx);
	    }
	}
	health.Health = Health;
	
	return health;
}

var ingest = {};

var ingestSourceConsumerPortalAccessIn = {};

var hasRequiredIngestSourceConsumerPortalAccessIn;

function requireIngestSourceConsumerPortalAccessIn () {
	if (hasRequiredIngestSourceConsumerPortalAccessIn) return ingestSourceConsumerPortalAccessIn;
	hasRequiredIngestSourceConsumerPortalAccessIn = 1;
	Object.defineProperty(ingestSourceConsumerPortalAccessIn, "__esModule", { value: true });
	ingestSourceConsumerPortalAccessIn.IngestSourceConsumerPortalAccessInSerializer = void 0;
	ingestSourceConsumerPortalAccessIn.IngestSourceConsumerPortalAccessInSerializer = {
	    _fromJsonObject(object) {
	        return {
	            expiry: object["expiry"],
	            readOnly: object["readOnly"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            expiry: self.expiry,
	            readOnly: self.readOnly,
	        };
	    },
	};
	
	return ingestSourceConsumerPortalAccessIn;
}

var ingestEndpoint = {};

var ingestEndpointHeadersIn = {};

var hasRequiredIngestEndpointHeadersIn;

function requireIngestEndpointHeadersIn () {
	if (hasRequiredIngestEndpointHeadersIn) return ingestEndpointHeadersIn;
	hasRequiredIngestEndpointHeadersIn = 1;
	Object.defineProperty(ingestEndpointHeadersIn, "__esModule", { value: true });
	ingestEndpointHeadersIn.IngestEndpointHeadersInSerializer = void 0;
	ingestEndpointHeadersIn.IngestEndpointHeadersInSerializer = {
	    _fromJsonObject(object) {
	        return {
	            headers: object["headers"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            headers: self.headers,
	        };
	    },
	};
	
	return ingestEndpointHeadersIn;
}

var ingestEndpointHeadersOut = {};

var hasRequiredIngestEndpointHeadersOut;

function requireIngestEndpointHeadersOut () {
	if (hasRequiredIngestEndpointHeadersOut) return ingestEndpointHeadersOut;
	hasRequiredIngestEndpointHeadersOut = 1;
	Object.defineProperty(ingestEndpointHeadersOut, "__esModule", { value: true });
	ingestEndpointHeadersOut.IngestEndpointHeadersOutSerializer = void 0;
	ingestEndpointHeadersOut.IngestEndpointHeadersOutSerializer = {
	    _fromJsonObject(object) {
	        return {
	            headers: object["headers"],
	            sensitive: object["sensitive"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            headers: self.headers,
	            sensitive: self.sensitive,
	        };
	    },
	};
	
	return ingestEndpointHeadersOut;
}

var ingestEndpointIn = {};

var hasRequiredIngestEndpointIn;

function requireIngestEndpointIn () {
	if (hasRequiredIngestEndpointIn) return ingestEndpointIn;
	hasRequiredIngestEndpointIn = 1;
	Object.defineProperty(ingestEndpointIn, "__esModule", { value: true });
	ingestEndpointIn.IngestEndpointInSerializer = void 0;
	ingestEndpointIn.IngestEndpointInSerializer = {
	    _fromJsonObject(object) {
	        return {
	            description: object["description"],
	            disabled: object["disabled"],
	            metadata: object["metadata"],
	            rateLimit: object["rateLimit"],
	            secret: object["secret"],
	            uid: object["uid"],
	            url: object["url"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            description: self.description,
	            disabled: self.disabled,
	            metadata: self.metadata,
	            rateLimit: self.rateLimit,
	            secret: self.secret,
	            uid: self.uid,
	            url: self.url,
	        };
	    },
	};
	
	return ingestEndpointIn;
}

var ingestEndpointOut = {};

var hasRequiredIngestEndpointOut;

function requireIngestEndpointOut () {
	if (hasRequiredIngestEndpointOut) return ingestEndpointOut;
	hasRequiredIngestEndpointOut = 1;
	Object.defineProperty(ingestEndpointOut, "__esModule", { value: true });
	ingestEndpointOut.IngestEndpointOutSerializer = void 0;
	ingestEndpointOut.IngestEndpointOutSerializer = {
	    _fromJsonObject(object) {
	        return {
	            createdAt: new Date(object["createdAt"]),
	            description: object["description"],
	            disabled: object["disabled"],
	            id: object["id"],
	            metadata: object["metadata"],
	            rateLimit: object["rateLimit"],
	            uid: object["uid"],
	            updatedAt: new Date(object["updatedAt"]),
	            url: object["url"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            createdAt: self.createdAt,
	            description: self.description,
	            disabled: self.disabled,
	            id: self.id,
	            metadata: self.metadata,
	            rateLimit: self.rateLimit,
	            uid: self.uid,
	            updatedAt: self.updatedAt,
	            url: self.url,
	        };
	    },
	};
	
	return ingestEndpointOut;
}

var ingestEndpointSecretIn = {};

var hasRequiredIngestEndpointSecretIn;

function requireIngestEndpointSecretIn () {
	if (hasRequiredIngestEndpointSecretIn) return ingestEndpointSecretIn;
	hasRequiredIngestEndpointSecretIn = 1;
	Object.defineProperty(ingestEndpointSecretIn, "__esModule", { value: true });
	ingestEndpointSecretIn.IngestEndpointSecretInSerializer = void 0;
	ingestEndpointSecretIn.IngestEndpointSecretInSerializer = {
	    _fromJsonObject(object) {
	        return {
	            key: object["key"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            key: self.key,
	        };
	    },
	};
	
	return ingestEndpointSecretIn;
}

var ingestEndpointSecretOut = {};

var hasRequiredIngestEndpointSecretOut;

function requireIngestEndpointSecretOut () {
	if (hasRequiredIngestEndpointSecretOut) return ingestEndpointSecretOut;
	hasRequiredIngestEndpointSecretOut = 1;
	Object.defineProperty(ingestEndpointSecretOut, "__esModule", { value: true });
	ingestEndpointSecretOut.IngestEndpointSecretOutSerializer = void 0;
	ingestEndpointSecretOut.IngestEndpointSecretOutSerializer = {
	    _fromJsonObject(object) {
	        return {
	            key: object["key"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            key: self.key,
	        };
	    },
	};
	
	return ingestEndpointSecretOut;
}

var ingestEndpointTransformationOut = {};

var hasRequiredIngestEndpointTransformationOut;

function requireIngestEndpointTransformationOut () {
	if (hasRequiredIngestEndpointTransformationOut) return ingestEndpointTransformationOut;
	hasRequiredIngestEndpointTransformationOut = 1;
	Object.defineProperty(ingestEndpointTransformationOut, "__esModule", { value: true });
	ingestEndpointTransformationOut.IngestEndpointTransformationOutSerializer = void 0;
	ingestEndpointTransformationOut.IngestEndpointTransformationOutSerializer = {
	    _fromJsonObject(object) {
	        return {
	            code: object["code"],
	            enabled: object["enabled"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            code: self.code,
	            enabled: self.enabled,
	        };
	    },
	};
	
	return ingestEndpointTransformationOut;
}

var ingestEndpointTransformationPatch = {};

var hasRequiredIngestEndpointTransformationPatch;

function requireIngestEndpointTransformationPatch () {
	if (hasRequiredIngestEndpointTransformationPatch) return ingestEndpointTransformationPatch;
	hasRequiredIngestEndpointTransformationPatch = 1;
	Object.defineProperty(ingestEndpointTransformationPatch, "__esModule", { value: true });
	ingestEndpointTransformationPatch.IngestEndpointTransformationPatchSerializer = void 0;
	ingestEndpointTransformationPatch.IngestEndpointTransformationPatchSerializer = {
	    _fromJsonObject(object) {
	        return {
	            code: object["code"],
	            enabled: object["enabled"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            code: self.code,
	            enabled: self.enabled,
	        };
	    },
	};
	
	return ingestEndpointTransformationPatch;
}

var ingestEndpointUpdate = {};

var hasRequiredIngestEndpointUpdate;

function requireIngestEndpointUpdate () {
	if (hasRequiredIngestEndpointUpdate) return ingestEndpointUpdate;
	hasRequiredIngestEndpointUpdate = 1;
	Object.defineProperty(ingestEndpointUpdate, "__esModule", { value: true });
	ingestEndpointUpdate.IngestEndpointUpdateSerializer = void 0;
	ingestEndpointUpdate.IngestEndpointUpdateSerializer = {
	    _fromJsonObject(object) {
	        return {
	            description: object["description"],
	            disabled: object["disabled"],
	            metadata: object["metadata"],
	            rateLimit: object["rateLimit"],
	            uid: object["uid"],
	            url: object["url"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            description: self.description,
	            disabled: self.disabled,
	            metadata: self.metadata,
	            rateLimit: self.rateLimit,
	            uid: self.uid,
	            url: self.url,
	        };
	    },
	};
	
	return ingestEndpointUpdate;
}

var listResponseIngestEndpointOut = {};

var hasRequiredListResponseIngestEndpointOut;

function requireListResponseIngestEndpointOut () {
	if (hasRequiredListResponseIngestEndpointOut) return listResponseIngestEndpointOut;
	hasRequiredListResponseIngestEndpointOut = 1;
	Object.defineProperty(listResponseIngestEndpointOut, "__esModule", { value: true });
	listResponseIngestEndpointOut.ListResponseIngestEndpointOutSerializer = void 0;
	const ingestEndpointOut_1 = requireIngestEndpointOut();
	listResponseIngestEndpointOut.ListResponseIngestEndpointOutSerializer = {
	    _fromJsonObject(object) {
	        return {
	            data: object["data"].map((item) => ingestEndpointOut_1.IngestEndpointOutSerializer._fromJsonObject(item)),
	            done: object["done"],
	            iterator: object["iterator"],
	            prevIterator: object["prevIterator"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            data: self.data.map((item) => ingestEndpointOut_1.IngestEndpointOutSerializer._toJsonObject(item)),
	            done: self.done,
	            iterator: self.iterator,
	            prevIterator: self.prevIterator,
	        };
	    },
	};
	
	return listResponseIngestEndpointOut;
}

var hasRequiredIngestEndpoint;

function requireIngestEndpoint () {
	if (hasRequiredIngestEndpoint) return ingestEndpoint;
	hasRequiredIngestEndpoint = 1;
	Object.defineProperty(ingestEndpoint, "__esModule", { value: true });
	ingestEndpoint.IngestEndpoint = void 0;
	const ingestEndpointHeadersIn_1 = requireIngestEndpointHeadersIn();
	const ingestEndpointHeadersOut_1 = requireIngestEndpointHeadersOut();
	const ingestEndpointIn_1 = requireIngestEndpointIn();
	const ingestEndpointOut_1 = requireIngestEndpointOut();
	const ingestEndpointSecretIn_1 = requireIngestEndpointSecretIn();
	const ingestEndpointSecretOut_1 = requireIngestEndpointSecretOut();
	const ingestEndpointTransformationOut_1 = requireIngestEndpointTransformationOut();
	const ingestEndpointTransformationPatch_1 = requireIngestEndpointTransformationPatch();
	const ingestEndpointUpdate_1 = requireIngestEndpointUpdate();
	const listResponseIngestEndpointOut_1 = requireListResponseIngestEndpointOut();
	const request_1 = requireRequest();
	class IngestEndpoint {
	    constructor(requestCtx) {
	        this.requestCtx = requestCtx;
	    }
	    list(sourceId, options) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/ingest/api/v1/source/{source_id}/endpoint");
	        request.setPathParam("source_id", sourceId);
	        request.setQueryParams({
	            limit: options === null || options === void 0 ? void 0 : options.limit,
	            iterator: options === null || options === void 0 ? void 0 : options.iterator,
	            order: options === null || options === void 0 ? void 0 : options.order,
	        });
	        return request.send(this.requestCtx, listResponseIngestEndpointOut_1.ListResponseIngestEndpointOutSerializer._fromJsonObject);
	    }
	    create(sourceId, ingestEndpointIn, options) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/ingest/api/v1/source/{source_id}/endpoint");
	        request.setPathParam("source_id", sourceId);
	        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
	        request.setBody(ingestEndpointIn_1.IngestEndpointInSerializer._toJsonObject(ingestEndpointIn));
	        return request.send(this.requestCtx, ingestEndpointOut_1.IngestEndpointOutSerializer._fromJsonObject);
	    }
	    get(sourceId, endpointId) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/ingest/api/v1/source/{source_id}/endpoint/{endpoint_id}");
	        request.setPathParam("source_id", sourceId);
	        request.setPathParam("endpoint_id", endpointId);
	        return request.send(this.requestCtx, ingestEndpointOut_1.IngestEndpointOutSerializer._fromJsonObject);
	    }
	    update(sourceId, endpointId, ingestEndpointUpdate) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.PUT, "/ingest/api/v1/source/{source_id}/endpoint/{endpoint_id}");
	        request.setPathParam("source_id", sourceId);
	        request.setPathParam("endpoint_id", endpointId);
	        request.setBody(ingestEndpointUpdate_1.IngestEndpointUpdateSerializer._toJsonObject(ingestEndpointUpdate));
	        return request.send(this.requestCtx, ingestEndpointOut_1.IngestEndpointOutSerializer._fromJsonObject);
	    }
	    delete(sourceId, endpointId) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.DELETE, "/ingest/api/v1/source/{source_id}/endpoint/{endpoint_id}");
	        request.setPathParam("source_id", sourceId);
	        request.setPathParam("endpoint_id", endpointId);
	        return request.sendNoResponseBody(this.requestCtx);
	    }
	    getHeaders(sourceId, endpointId) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/ingest/api/v1/source/{source_id}/endpoint/{endpoint_id}/headers");
	        request.setPathParam("source_id", sourceId);
	        request.setPathParam("endpoint_id", endpointId);
	        return request.send(this.requestCtx, ingestEndpointHeadersOut_1.IngestEndpointHeadersOutSerializer._fromJsonObject);
	    }
	    updateHeaders(sourceId, endpointId, ingestEndpointHeadersIn) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.PUT, "/ingest/api/v1/source/{source_id}/endpoint/{endpoint_id}/headers");
	        request.setPathParam("source_id", sourceId);
	        request.setPathParam("endpoint_id", endpointId);
	        request.setBody(ingestEndpointHeadersIn_1.IngestEndpointHeadersInSerializer._toJsonObject(ingestEndpointHeadersIn));
	        return request.sendNoResponseBody(this.requestCtx);
	    }
	    getSecret(sourceId, endpointId) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/ingest/api/v1/source/{source_id}/endpoint/{endpoint_id}/secret");
	        request.setPathParam("source_id", sourceId);
	        request.setPathParam("endpoint_id", endpointId);
	        return request.send(this.requestCtx, ingestEndpointSecretOut_1.IngestEndpointSecretOutSerializer._fromJsonObject);
	    }
	    rotateSecret(sourceId, endpointId, ingestEndpointSecretIn, options) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/ingest/api/v1/source/{source_id}/endpoint/{endpoint_id}/secret/rotate");
	        request.setPathParam("source_id", sourceId);
	        request.setPathParam("endpoint_id", endpointId);
	        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
	        request.setBody(ingestEndpointSecretIn_1.IngestEndpointSecretInSerializer._toJsonObject(ingestEndpointSecretIn));
	        return request.sendNoResponseBody(this.requestCtx);
	    }
	    getTransformation(sourceId, endpointId) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/ingest/api/v1/source/{source_id}/endpoint/{endpoint_id}/transformation");
	        request.setPathParam("source_id", sourceId);
	        request.setPathParam("endpoint_id", endpointId);
	        return request.send(this.requestCtx, ingestEndpointTransformationOut_1.IngestEndpointTransformationOutSerializer._fromJsonObject);
	    }
	    setTransformation(sourceId, endpointId, ingestEndpointTransformationPatch) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.PATCH, "/ingest/api/v1/source/{source_id}/endpoint/{endpoint_id}/transformation");
	        request.setPathParam("source_id", sourceId);
	        request.setPathParam("endpoint_id", endpointId);
	        request.setBody(ingestEndpointTransformationPatch_1.IngestEndpointTransformationPatchSerializer._toJsonObject(ingestEndpointTransformationPatch));
	        return request.sendNoResponseBody(this.requestCtx);
	    }
	}
	ingestEndpoint.IngestEndpoint = IngestEndpoint;
	
	return ingestEndpoint;
}

var ingestSource = {};

var ingestSourceIn = {};

var adobeSignConfig = {};

var hasRequiredAdobeSignConfig;

function requireAdobeSignConfig () {
	if (hasRequiredAdobeSignConfig) return adobeSignConfig;
	hasRequiredAdobeSignConfig = 1;
	Object.defineProperty(adobeSignConfig, "__esModule", { value: true });
	adobeSignConfig.AdobeSignConfigSerializer = void 0;
	adobeSignConfig.AdobeSignConfigSerializer = {
	    _fromJsonObject(object) {
	        return {
	            clientId: object["clientId"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            clientId: self.clientId,
	        };
	    },
	};
	
	return adobeSignConfig;
}

var airwallexConfig = {};

var hasRequiredAirwallexConfig;

function requireAirwallexConfig () {
	if (hasRequiredAirwallexConfig) return airwallexConfig;
	hasRequiredAirwallexConfig = 1;
	Object.defineProperty(airwallexConfig, "__esModule", { value: true });
	airwallexConfig.AirwallexConfigSerializer = void 0;
	airwallexConfig.AirwallexConfigSerializer = {
	    _fromJsonObject(object) {
	        return {
	            secret: object["secret"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            secret: self.secret,
	        };
	    },
	};
	
	return airwallexConfig;
}

var checkbookConfig = {};

var hasRequiredCheckbookConfig;

function requireCheckbookConfig () {
	if (hasRequiredCheckbookConfig) return checkbookConfig;
	hasRequiredCheckbookConfig = 1;
	Object.defineProperty(checkbookConfig, "__esModule", { value: true });
	checkbookConfig.CheckbookConfigSerializer = void 0;
	checkbookConfig.CheckbookConfigSerializer = {
	    _fromJsonObject(object) {
	        return {
	            secret: object["secret"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            secret: self.secret,
	        };
	    },
	};
	
	return checkbookConfig;
}

var cronConfig = {};

var hasRequiredCronConfig;

function requireCronConfig () {
	if (hasRequiredCronConfig) return cronConfig;
	hasRequiredCronConfig = 1;
	Object.defineProperty(cronConfig, "__esModule", { value: true });
	cronConfig.CronConfigSerializer = void 0;
	cronConfig.CronConfigSerializer = {
	    _fromJsonObject(object) {
	        return {
	            contentType: object["contentType"],
	            payload: object["payload"],
	            schedule: object["schedule"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            contentType: self.contentType,
	            payload: self.payload,
	            schedule: self.schedule,
	        };
	    },
	};
	
	return cronConfig;
}

var docusignConfig = {};

var hasRequiredDocusignConfig;

function requireDocusignConfig () {
	if (hasRequiredDocusignConfig) return docusignConfig;
	hasRequiredDocusignConfig = 1;
	Object.defineProperty(docusignConfig, "__esModule", { value: true });
	docusignConfig.DocusignConfigSerializer = void 0;
	docusignConfig.DocusignConfigSerializer = {
	    _fromJsonObject(object) {
	        return {
	            secret: object["secret"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            secret: self.secret,
	        };
	    },
	};
	
	return docusignConfig;
}

var easypostConfig = {};

var hasRequiredEasypostConfig;

function requireEasypostConfig () {
	if (hasRequiredEasypostConfig) return easypostConfig;
	hasRequiredEasypostConfig = 1;
	Object.defineProperty(easypostConfig, "__esModule", { value: true });
	easypostConfig.EasypostConfigSerializer = void 0;
	easypostConfig.EasypostConfigSerializer = {
	    _fromJsonObject(object) {
	        return {
	            secret: object["secret"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            secret: self.secret,
	        };
	    },
	};
	
	return easypostConfig;
}

var githubConfig = {};

var hasRequiredGithubConfig;

function requireGithubConfig () {
	if (hasRequiredGithubConfig) return githubConfig;
	hasRequiredGithubConfig = 1;
	Object.defineProperty(githubConfig, "__esModule", { value: true });
	githubConfig.GithubConfigSerializer = void 0;
	githubConfig.GithubConfigSerializer = {
	    _fromJsonObject(object) {
	        return {
	            secret: object["secret"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            secret: self.secret,
	        };
	    },
	};
	
	return githubConfig;
}

var hubspotConfig = {};

var hasRequiredHubspotConfig;

function requireHubspotConfig () {
	if (hasRequiredHubspotConfig) return hubspotConfig;
	hasRequiredHubspotConfig = 1;
	Object.defineProperty(hubspotConfig, "__esModule", { value: true });
	hubspotConfig.HubspotConfigSerializer = void 0;
	hubspotConfig.HubspotConfigSerializer = {
	    _fromJsonObject(object) {
	        return {
	            secret: object["secret"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            secret: self.secret,
	        };
	    },
	};
	
	return hubspotConfig;
}

var metaConfig = {};

var hasRequiredMetaConfig;

function requireMetaConfig () {
	if (hasRequiredMetaConfig) return metaConfig;
	hasRequiredMetaConfig = 1;
	Object.defineProperty(metaConfig, "__esModule", { value: true });
	metaConfig.MetaConfigSerializer = void 0;
	metaConfig.MetaConfigSerializer = {
	    _fromJsonObject(object) {
	        return {
	            secret: object["secret"],
	            verifyToken: object["verifyToken"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            secret: self.secret,
	            verifyToken: self.verifyToken,
	        };
	    },
	};
	
	return metaConfig;
}

var orumIoConfig = {};

var hasRequiredOrumIoConfig;

function requireOrumIoConfig () {
	if (hasRequiredOrumIoConfig) return orumIoConfig;
	hasRequiredOrumIoConfig = 1;
	Object.defineProperty(orumIoConfig, "__esModule", { value: true });
	orumIoConfig.OrumIoConfigSerializer = void 0;
	orumIoConfig.OrumIoConfigSerializer = {
	    _fromJsonObject(object) {
	        return {
	            publicKey: object["publicKey"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            publicKey: self.publicKey,
	        };
	    },
	};
	
	return orumIoConfig;
}

var pandaDocConfig = {};

var hasRequiredPandaDocConfig;

function requirePandaDocConfig () {
	if (hasRequiredPandaDocConfig) return pandaDocConfig;
	hasRequiredPandaDocConfig = 1;
	Object.defineProperty(pandaDocConfig, "__esModule", { value: true });
	pandaDocConfig.PandaDocConfigSerializer = void 0;
	pandaDocConfig.PandaDocConfigSerializer = {
	    _fromJsonObject(object) {
	        return {
	            secret: object["secret"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            secret: self.secret,
	        };
	    },
	};
	
	return pandaDocConfig;
}

var portIoConfig = {};

var hasRequiredPortIoConfig;

function requirePortIoConfig () {
	if (hasRequiredPortIoConfig) return portIoConfig;
	hasRequiredPortIoConfig = 1;
	Object.defineProperty(portIoConfig, "__esModule", { value: true });
	portIoConfig.PortIoConfigSerializer = void 0;
	portIoConfig.PortIoConfigSerializer = {
	    _fromJsonObject(object) {
	        return {
	            secret: object["secret"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            secret: self.secret,
	        };
	    },
	};
	
	return portIoConfig;
}

var rutterConfig = {};

var hasRequiredRutterConfig;

function requireRutterConfig () {
	if (hasRequiredRutterConfig) return rutterConfig;
	hasRequiredRutterConfig = 1;
	Object.defineProperty(rutterConfig, "__esModule", { value: true });
	rutterConfig.RutterConfigSerializer = void 0;
	rutterConfig.RutterConfigSerializer = {
	    _fromJsonObject(object) {
	        return {
	            secret: object["secret"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            secret: self.secret,
	        };
	    },
	};
	
	return rutterConfig;
}

var segmentConfig = {};

var hasRequiredSegmentConfig;

function requireSegmentConfig () {
	if (hasRequiredSegmentConfig) return segmentConfig;
	hasRequiredSegmentConfig = 1;
	Object.defineProperty(segmentConfig, "__esModule", { value: true });
	segmentConfig.SegmentConfigSerializer = void 0;
	segmentConfig.SegmentConfigSerializer = {
	    _fromJsonObject(object) {
	        return {
	            secret: object["secret"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            secret: self.secret,
	        };
	    },
	};
	
	return segmentConfig;
}

var shopifyConfig = {};

var hasRequiredShopifyConfig;

function requireShopifyConfig () {
	if (hasRequiredShopifyConfig) return shopifyConfig;
	hasRequiredShopifyConfig = 1;
	Object.defineProperty(shopifyConfig, "__esModule", { value: true });
	shopifyConfig.ShopifyConfigSerializer = void 0;
	shopifyConfig.ShopifyConfigSerializer = {
	    _fromJsonObject(object) {
	        return {
	            secret: object["secret"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            secret: self.secret,
	        };
	    },
	};
	
	return shopifyConfig;
}

var slackConfig = {};

var hasRequiredSlackConfig;

function requireSlackConfig () {
	if (hasRequiredSlackConfig) return slackConfig;
	hasRequiredSlackConfig = 1;
	Object.defineProperty(slackConfig, "__esModule", { value: true });
	slackConfig.SlackConfigSerializer = void 0;
	slackConfig.SlackConfigSerializer = {
	    _fromJsonObject(object) {
	        return {
	            secret: object["secret"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            secret: self.secret,
	        };
	    },
	};
	
	return slackConfig;
}

var stripeConfig = {};

var hasRequiredStripeConfig;

function requireStripeConfig () {
	if (hasRequiredStripeConfig) return stripeConfig;
	hasRequiredStripeConfig = 1;
	Object.defineProperty(stripeConfig, "__esModule", { value: true });
	stripeConfig.StripeConfigSerializer = void 0;
	stripeConfig.StripeConfigSerializer = {
	    _fromJsonObject(object) {
	        return {
	            secret: object["secret"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            secret: self.secret,
	        };
	    },
	};
	
	return stripeConfig;
}

var svixConfig = {};

var hasRequiredSvixConfig;

function requireSvixConfig () {
	if (hasRequiredSvixConfig) return svixConfig;
	hasRequiredSvixConfig = 1;
	Object.defineProperty(svixConfig, "__esModule", { value: true });
	svixConfig.SvixConfigSerializer = void 0;
	svixConfig.SvixConfigSerializer = {
	    _fromJsonObject(object) {
	        return {
	            secret: object["secret"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            secret: self.secret,
	        };
	    },
	};
	
	return svixConfig;
}

var telnyxConfig = {};

var hasRequiredTelnyxConfig;

function requireTelnyxConfig () {
	if (hasRequiredTelnyxConfig) return telnyxConfig;
	hasRequiredTelnyxConfig = 1;
	Object.defineProperty(telnyxConfig, "__esModule", { value: true });
	telnyxConfig.TelnyxConfigSerializer = void 0;
	telnyxConfig.TelnyxConfigSerializer = {
	    _fromJsonObject(object) {
	        return {
	            publicKey: object["publicKey"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            publicKey: self.publicKey,
	        };
	    },
	};
	
	return telnyxConfig;
}

var vapiConfig = {};

var hasRequiredVapiConfig;

function requireVapiConfig () {
	if (hasRequiredVapiConfig) return vapiConfig;
	hasRequiredVapiConfig = 1;
	Object.defineProperty(vapiConfig, "__esModule", { value: true });
	vapiConfig.VapiConfigSerializer = void 0;
	vapiConfig.VapiConfigSerializer = {
	    _fromJsonObject(object) {
	        return {
	            secret: object["secret"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            secret: self.secret,
	        };
	    },
	};
	
	return vapiConfig;
}

var veriffConfig = {};

var hasRequiredVeriffConfig;

function requireVeriffConfig () {
	if (hasRequiredVeriffConfig) return veriffConfig;
	hasRequiredVeriffConfig = 1;
	Object.defineProperty(veriffConfig, "__esModule", { value: true });
	veriffConfig.VeriffConfigSerializer = void 0;
	veriffConfig.VeriffConfigSerializer = {
	    _fromJsonObject(object) {
	        return {
	            secret: object["secret"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            secret: self.secret,
	        };
	    },
	};
	
	return veriffConfig;
}

var zoomConfig = {};

var hasRequiredZoomConfig;

function requireZoomConfig () {
	if (hasRequiredZoomConfig) return zoomConfig;
	hasRequiredZoomConfig = 1;
	Object.defineProperty(zoomConfig, "__esModule", { value: true });
	zoomConfig.ZoomConfigSerializer = void 0;
	zoomConfig.ZoomConfigSerializer = {
	    _fromJsonObject(object) {
	        return {
	            secret: object["secret"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            secret: self.secret,
	        };
	    },
	};
	
	return zoomConfig;
}

var hasRequiredIngestSourceIn;

function requireIngestSourceIn () {
	if (hasRequiredIngestSourceIn) return ingestSourceIn;
	hasRequiredIngestSourceIn = 1;
	Object.defineProperty(ingestSourceIn, "__esModule", { value: true });
	ingestSourceIn.IngestSourceInSerializer = void 0;
	const adobeSignConfig_1 = requireAdobeSignConfig();
	const airwallexConfig_1 = requireAirwallexConfig();
	const checkbookConfig_1 = requireCheckbookConfig();
	const cronConfig_1 = requireCronConfig();
	const docusignConfig_1 = requireDocusignConfig();
	const easypostConfig_1 = requireEasypostConfig();
	const githubConfig_1 = requireGithubConfig();
	const hubspotConfig_1 = requireHubspotConfig();
	const metaConfig_1 = requireMetaConfig();
	const orumIoConfig_1 = requireOrumIoConfig();
	const pandaDocConfig_1 = requirePandaDocConfig();
	const portIoConfig_1 = requirePortIoConfig();
	const rutterConfig_1 = requireRutterConfig();
	const segmentConfig_1 = requireSegmentConfig();
	const shopifyConfig_1 = requireShopifyConfig();
	const slackConfig_1 = requireSlackConfig();
	const stripeConfig_1 = requireStripeConfig();
	const svixConfig_1 = requireSvixConfig();
	const telnyxConfig_1 = requireTelnyxConfig();
	const vapiConfig_1 = requireVapiConfig();
	const veriffConfig_1 = requireVeriffConfig();
	const zoomConfig_1 = requireZoomConfig();
	ingestSourceIn.IngestSourceInSerializer = {
	    _fromJsonObject(object) {
	        const type = object["type"];
	        function getConfig(type) {
	            switch (type) {
	                case "generic-webhook":
	                    return {};
	                case "cron":
	                    return cronConfig_1.CronConfigSerializer._fromJsonObject(object["config"]);
	                case "adobe-sign":
	                    return adobeSignConfig_1.AdobeSignConfigSerializer._fromJsonObject(object["config"]);
	                case "beehiiv":
	                    return svixConfig_1.SvixConfigSerializer._fromJsonObject(object["config"]);
	                case "brex":
	                    return svixConfig_1.SvixConfigSerializer._fromJsonObject(object["config"]);
	                case "checkbook":
	                    return checkbookConfig_1.CheckbookConfigSerializer._fromJsonObject(object["config"]);
	                case "clerk":
	                    return svixConfig_1.SvixConfigSerializer._fromJsonObject(object["config"]);
	                case "docusign":
	                    return docusignConfig_1.DocusignConfigSerializer._fromJsonObject(object["config"]);
	                case "easypost":
	                    return easypostConfig_1.EasypostConfigSerializer._fromJsonObject(object["config"]);
	                case "github":
	                    return githubConfig_1.GithubConfigSerializer._fromJsonObject(object["config"]);
	                case "guesty":
	                    return svixConfig_1.SvixConfigSerializer._fromJsonObject(object["config"]);
	                case "hubspot":
	                    return hubspotConfig_1.HubspotConfigSerializer._fromJsonObject(object["config"]);
	                case "incident-io":
	                    return svixConfig_1.SvixConfigSerializer._fromJsonObject(object["config"]);
	                case "lithic":
	                    return svixConfig_1.SvixConfigSerializer._fromJsonObject(object["config"]);
	                case "meta":
	                    return metaConfig_1.MetaConfigSerializer._fromJsonObject(object["config"]);
	                case "nash":
	                    return svixConfig_1.SvixConfigSerializer._fromJsonObject(object["config"]);
	                case "orum-io":
	                    return orumIoConfig_1.OrumIoConfigSerializer._fromJsonObject(object["config"]);
	                case "panda-doc":
	                    return pandaDocConfig_1.PandaDocConfigSerializer._fromJsonObject(object["config"]);
	                case "port-io":
	                    return portIoConfig_1.PortIoConfigSerializer._fromJsonObject(object["config"]);
	                case "pleo":
	                    return svixConfig_1.SvixConfigSerializer._fromJsonObject(object["config"]);
	                case "psi-fi":
	                    return svixConfig_1.SvixConfigSerializer._fromJsonObject(object["config"]);
	                case "replicate":
	                    return svixConfig_1.SvixConfigSerializer._fromJsonObject(object["config"]);
	                case "resend":
	                    return svixConfig_1.SvixConfigSerializer._fromJsonObject(object["config"]);
	                case "rutter":
	                    return rutterConfig_1.RutterConfigSerializer._fromJsonObject(object["config"]);
	                case "safebase":
	                    return svixConfig_1.SvixConfigSerializer._fromJsonObject(object["config"]);
	                case "sardine":
	                    return svixConfig_1.SvixConfigSerializer._fromJsonObject(object["config"]);
	                case "segment":
	                    return segmentConfig_1.SegmentConfigSerializer._fromJsonObject(object["config"]);
	                case "shopify":
	                    return shopifyConfig_1.ShopifyConfigSerializer._fromJsonObject(object["config"]);
	                case "slack":
	                    return slackConfig_1.SlackConfigSerializer._fromJsonObject(object["config"]);
	                case "stripe":
	                    return stripeConfig_1.StripeConfigSerializer._fromJsonObject(object["config"]);
	                case "stych":
	                    return svixConfig_1.SvixConfigSerializer._fromJsonObject(object["config"]);
	                case "svix":
	                    return svixConfig_1.SvixConfigSerializer._fromJsonObject(object["config"]);
	                case "zoom":
	                    return zoomConfig_1.ZoomConfigSerializer._fromJsonObject(object["config"]);
	                case "telnyx":
	                    return telnyxConfig_1.TelnyxConfigSerializer._fromJsonObject(object["config"]);
	                case "vapi":
	                    return vapiConfig_1.VapiConfigSerializer._fromJsonObject(object["config"]);
	                case "open-ai":
	                    return svixConfig_1.SvixConfigSerializer._fromJsonObject(object["config"]);
	                case "render":
	                    return svixConfig_1.SvixConfigSerializer._fromJsonObject(object["config"]);
	                case "veriff":
	                    return veriffConfig_1.VeriffConfigSerializer._fromJsonObject(object["config"]);
	                case "airwallex":
	                    return airwallexConfig_1.AirwallexConfigSerializer._fromJsonObject(object["config"]);
	                default:
	                    throw new Error(`Unexpected type: ${type}`);
	            }
	        }
	        return {
	            type,
	            config: getConfig(type),
	            metadata: object["metadata"],
	            name: object["name"],
	            uid: object["uid"],
	        };
	    },
	    _toJsonObject(self) {
	        let config;
	        switch (self.type) {
	            case "generic-webhook":
	                config = {};
	                break;
	            case "cron":
	                config = cronConfig_1.CronConfigSerializer._toJsonObject(self.config);
	                break;
	            case "adobe-sign":
	                config = adobeSignConfig_1.AdobeSignConfigSerializer._toJsonObject(self.config);
	                break;
	            case "beehiiv":
	                config = svixConfig_1.SvixConfigSerializer._toJsonObject(self.config);
	                break;
	            case "brex":
	                config = svixConfig_1.SvixConfigSerializer._toJsonObject(self.config);
	                break;
	            case "checkbook":
	                config = checkbookConfig_1.CheckbookConfigSerializer._toJsonObject(self.config);
	                break;
	            case "clerk":
	                config = svixConfig_1.SvixConfigSerializer._toJsonObject(self.config);
	                break;
	            case "docusign":
	                config = docusignConfig_1.DocusignConfigSerializer._toJsonObject(self.config);
	                break;
	            case "easypost":
	                config = easypostConfig_1.EasypostConfigSerializer._toJsonObject(self.config);
	                break;
	            case "github":
	                config = githubConfig_1.GithubConfigSerializer._toJsonObject(self.config);
	                break;
	            case "guesty":
	                config = svixConfig_1.SvixConfigSerializer._toJsonObject(self.config);
	                break;
	            case "hubspot":
	                config = hubspotConfig_1.HubspotConfigSerializer._toJsonObject(self.config);
	                break;
	            case "incident-io":
	                config = svixConfig_1.SvixConfigSerializer._toJsonObject(self.config);
	                break;
	            case "lithic":
	                config = svixConfig_1.SvixConfigSerializer._toJsonObject(self.config);
	                break;
	            case "meta":
	                config = metaConfig_1.MetaConfigSerializer._toJsonObject(self.config);
	                break;
	            case "nash":
	                config = svixConfig_1.SvixConfigSerializer._toJsonObject(self.config);
	                break;
	            case "orum-io":
	                config = orumIoConfig_1.OrumIoConfigSerializer._toJsonObject(self.config);
	                break;
	            case "panda-doc":
	                config = pandaDocConfig_1.PandaDocConfigSerializer._toJsonObject(self.config);
	                break;
	            case "port-io":
	                config = portIoConfig_1.PortIoConfigSerializer._toJsonObject(self.config);
	                break;
	            case "pleo":
	                config = svixConfig_1.SvixConfigSerializer._toJsonObject(self.config);
	                break;
	            case "psi-fi":
	                config = svixConfig_1.SvixConfigSerializer._toJsonObject(self.config);
	                break;
	            case "replicate":
	                config = svixConfig_1.SvixConfigSerializer._toJsonObject(self.config);
	                break;
	            case "resend":
	                config = svixConfig_1.SvixConfigSerializer._toJsonObject(self.config);
	                break;
	            case "rutter":
	                config = rutterConfig_1.RutterConfigSerializer._toJsonObject(self.config);
	                break;
	            case "safebase":
	                config = svixConfig_1.SvixConfigSerializer._toJsonObject(self.config);
	                break;
	            case "sardine":
	                config = svixConfig_1.SvixConfigSerializer._toJsonObject(self.config);
	                break;
	            case "segment":
	                config = segmentConfig_1.SegmentConfigSerializer._toJsonObject(self.config);
	                break;
	            case "shopify":
	                config = shopifyConfig_1.ShopifyConfigSerializer._toJsonObject(self.config);
	                break;
	            case "slack":
	                config = slackConfig_1.SlackConfigSerializer._toJsonObject(self.config);
	                break;
	            case "stripe":
	                config = stripeConfig_1.StripeConfigSerializer._toJsonObject(self.config);
	                break;
	            case "stych":
	                config = svixConfig_1.SvixConfigSerializer._toJsonObject(self.config);
	                break;
	            case "svix":
	                config = svixConfig_1.SvixConfigSerializer._toJsonObject(self.config);
	                break;
	            case "zoom":
	                config = zoomConfig_1.ZoomConfigSerializer._toJsonObject(self.config);
	                break;
	            case "telnyx":
	                config = telnyxConfig_1.TelnyxConfigSerializer._toJsonObject(self.config);
	                break;
	            case "vapi":
	                config = vapiConfig_1.VapiConfigSerializer._toJsonObject(self.config);
	                break;
	            case "open-ai":
	                config = svixConfig_1.SvixConfigSerializer._toJsonObject(self.config);
	                break;
	            case "render":
	                config = svixConfig_1.SvixConfigSerializer._toJsonObject(self.config);
	                break;
	            case "veriff":
	                config = veriffConfig_1.VeriffConfigSerializer._toJsonObject(self.config);
	                break;
	            case "airwallex":
	                config = airwallexConfig_1.AirwallexConfigSerializer._toJsonObject(self.config);
	                break;
	        }
	        return {
	            type: self.type,
	            config: config,
	            metadata: self.metadata,
	            name: self.name,
	            uid: self.uid,
	        };
	    },
	};
	
	return ingestSourceIn;
}

var ingestSourceOut = {};

var adobeSignConfigOut = {};

var hasRequiredAdobeSignConfigOut;

function requireAdobeSignConfigOut () {
	if (hasRequiredAdobeSignConfigOut) return adobeSignConfigOut;
	hasRequiredAdobeSignConfigOut = 1;
	Object.defineProperty(adobeSignConfigOut, "__esModule", { value: true });
	adobeSignConfigOut.AdobeSignConfigOutSerializer = void 0;
	adobeSignConfigOut.AdobeSignConfigOutSerializer = {
	    _fromJsonObject(_object) {
	        return {};
	    },
	    _toJsonObject(_self) {
	        return {};
	    },
	};
	
	return adobeSignConfigOut;
}

var airwallexConfigOut = {};

var hasRequiredAirwallexConfigOut;

function requireAirwallexConfigOut () {
	if (hasRequiredAirwallexConfigOut) return airwallexConfigOut;
	hasRequiredAirwallexConfigOut = 1;
	Object.defineProperty(airwallexConfigOut, "__esModule", { value: true });
	airwallexConfigOut.AirwallexConfigOutSerializer = void 0;
	airwallexConfigOut.AirwallexConfigOutSerializer = {
	    _fromJsonObject(_object) {
	        return {};
	    },
	    _toJsonObject(_self) {
	        return {};
	    },
	};
	
	return airwallexConfigOut;
}

var checkbookConfigOut = {};

var hasRequiredCheckbookConfigOut;

function requireCheckbookConfigOut () {
	if (hasRequiredCheckbookConfigOut) return checkbookConfigOut;
	hasRequiredCheckbookConfigOut = 1;
	Object.defineProperty(checkbookConfigOut, "__esModule", { value: true });
	checkbookConfigOut.CheckbookConfigOutSerializer = void 0;
	checkbookConfigOut.CheckbookConfigOutSerializer = {
	    _fromJsonObject(_object) {
	        return {};
	    },
	    _toJsonObject(_self) {
	        return {};
	    },
	};
	
	return checkbookConfigOut;
}

var docusignConfigOut = {};

var hasRequiredDocusignConfigOut;

function requireDocusignConfigOut () {
	if (hasRequiredDocusignConfigOut) return docusignConfigOut;
	hasRequiredDocusignConfigOut = 1;
	Object.defineProperty(docusignConfigOut, "__esModule", { value: true });
	docusignConfigOut.DocusignConfigOutSerializer = void 0;
	docusignConfigOut.DocusignConfigOutSerializer = {
	    _fromJsonObject(_object) {
	        return {};
	    },
	    _toJsonObject(_self) {
	        return {};
	    },
	};
	
	return docusignConfigOut;
}

var easypostConfigOut = {};

var hasRequiredEasypostConfigOut;

function requireEasypostConfigOut () {
	if (hasRequiredEasypostConfigOut) return easypostConfigOut;
	hasRequiredEasypostConfigOut = 1;
	Object.defineProperty(easypostConfigOut, "__esModule", { value: true });
	easypostConfigOut.EasypostConfigOutSerializer = void 0;
	easypostConfigOut.EasypostConfigOutSerializer = {
	    _fromJsonObject(_object) {
	        return {};
	    },
	    _toJsonObject(_self) {
	        return {};
	    },
	};
	
	return easypostConfigOut;
}

var githubConfigOut = {};

var hasRequiredGithubConfigOut;

function requireGithubConfigOut () {
	if (hasRequiredGithubConfigOut) return githubConfigOut;
	hasRequiredGithubConfigOut = 1;
	Object.defineProperty(githubConfigOut, "__esModule", { value: true });
	githubConfigOut.GithubConfigOutSerializer = void 0;
	githubConfigOut.GithubConfigOutSerializer = {
	    _fromJsonObject(_object) {
	        return {};
	    },
	    _toJsonObject(_self) {
	        return {};
	    },
	};
	
	return githubConfigOut;
}

var hubspotConfigOut = {};

var hasRequiredHubspotConfigOut;

function requireHubspotConfigOut () {
	if (hasRequiredHubspotConfigOut) return hubspotConfigOut;
	hasRequiredHubspotConfigOut = 1;
	Object.defineProperty(hubspotConfigOut, "__esModule", { value: true });
	hubspotConfigOut.HubspotConfigOutSerializer = void 0;
	hubspotConfigOut.HubspotConfigOutSerializer = {
	    _fromJsonObject(_object) {
	        return {};
	    },
	    _toJsonObject(_self) {
	        return {};
	    },
	};
	
	return hubspotConfigOut;
}

var metaConfigOut = {};

var hasRequiredMetaConfigOut;

function requireMetaConfigOut () {
	if (hasRequiredMetaConfigOut) return metaConfigOut;
	hasRequiredMetaConfigOut = 1;
	Object.defineProperty(metaConfigOut, "__esModule", { value: true });
	metaConfigOut.MetaConfigOutSerializer = void 0;
	metaConfigOut.MetaConfigOutSerializer = {
	    _fromJsonObject(_object) {
	        return {};
	    },
	    _toJsonObject(_self) {
	        return {};
	    },
	};
	
	return metaConfigOut;
}

var orumIoConfigOut = {};

var hasRequiredOrumIoConfigOut;

function requireOrumIoConfigOut () {
	if (hasRequiredOrumIoConfigOut) return orumIoConfigOut;
	hasRequiredOrumIoConfigOut = 1;
	Object.defineProperty(orumIoConfigOut, "__esModule", { value: true });
	orumIoConfigOut.OrumIoConfigOutSerializer = void 0;
	orumIoConfigOut.OrumIoConfigOutSerializer = {
	    _fromJsonObject(object) {
	        return {
	            publicKey: object["publicKey"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            publicKey: self.publicKey,
	        };
	    },
	};
	
	return orumIoConfigOut;
}

var pandaDocConfigOut = {};

var hasRequiredPandaDocConfigOut;

function requirePandaDocConfigOut () {
	if (hasRequiredPandaDocConfigOut) return pandaDocConfigOut;
	hasRequiredPandaDocConfigOut = 1;
	Object.defineProperty(pandaDocConfigOut, "__esModule", { value: true });
	pandaDocConfigOut.PandaDocConfigOutSerializer = void 0;
	pandaDocConfigOut.PandaDocConfigOutSerializer = {
	    _fromJsonObject(_object) {
	        return {};
	    },
	    _toJsonObject(_self) {
	        return {};
	    },
	};
	
	return pandaDocConfigOut;
}

var portIoConfigOut = {};

var hasRequiredPortIoConfigOut;

function requirePortIoConfigOut () {
	if (hasRequiredPortIoConfigOut) return portIoConfigOut;
	hasRequiredPortIoConfigOut = 1;
	Object.defineProperty(portIoConfigOut, "__esModule", { value: true });
	portIoConfigOut.PortIoConfigOutSerializer = void 0;
	portIoConfigOut.PortIoConfigOutSerializer = {
	    _fromJsonObject(_object) {
	        return {};
	    },
	    _toJsonObject(_self) {
	        return {};
	    },
	};
	
	return portIoConfigOut;
}

var rutterConfigOut = {};

var hasRequiredRutterConfigOut;

function requireRutterConfigOut () {
	if (hasRequiredRutterConfigOut) return rutterConfigOut;
	hasRequiredRutterConfigOut = 1;
	Object.defineProperty(rutterConfigOut, "__esModule", { value: true });
	rutterConfigOut.RutterConfigOutSerializer = void 0;
	rutterConfigOut.RutterConfigOutSerializer = {
	    _fromJsonObject(_object) {
	        return {};
	    },
	    _toJsonObject(_self) {
	        return {};
	    },
	};
	
	return rutterConfigOut;
}

var segmentConfigOut = {};

var hasRequiredSegmentConfigOut;

function requireSegmentConfigOut () {
	if (hasRequiredSegmentConfigOut) return segmentConfigOut;
	hasRequiredSegmentConfigOut = 1;
	Object.defineProperty(segmentConfigOut, "__esModule", { value: true });
	segmentConfigOut.SegmentConfigOutSerializer = void 0;
	segmentConfigOut.SegmentConfigOutSerializer = {
	    _fromJsonObject(_object) {
	        return {};
	    },
	    _toJsonObject(_self) {
	        return {};
	    },
	};
	
	return segmentConfigOut;
}

var shopifyConfigOut = {};

var hasRequiredShopifyConfigOut;

function requireShopifyConfigOut () {
	if (hasRequiredShopifyConfigOut) return shopifyConfigOut;
	hasRequiredShopifyConfigOut = 1;
	Object.defineProperty(shopifyConfigOut, "__esModule", { value: true });
	shopifyConfigOut.ShopifyConfigOutSerializer = void 0;
	shopifyConfigOut.ShopifyConfigOutSerializer = {
	    _fromJsonObject(_object) {
	        return {};
	    },
	    _toJsonObject(_self) {
	        return {};
	    },
	};
	
	return shopifyConfigOut;
}

var slackConfigOut = {};

var hasRequiredSlackConfigOut;

function requireSlackConfigOut () {
	if (hasRequiredSlackConfigOut) return slackConfigOut;
	hasRequiredSlackConfigOut = 1;
	Object.defineProperty(slackConfigOut, "__esModule", { value: true });
	slackConfigOut.SlackConfigOutSerializer = void 0;
	slackConfigOut.SlackConfigOutSerializer = {
	    _fromJsonObject(_object) {
	        return {};
	    },
	    _toJsonObject(_self) {
	        return {};
	    },
	};
	
	return slackConfigOut;
}

var stripeConfigOut = {};

var hasRequiredStripeConfigOut;

function requireStripeConfigOut () {
	if (hasRequiredStripeConfigOut) return stripeConfigOut;
	hasRequiredStripeConfigOut = 1;
	Object.defineProperty(stripeConfigOut, "__esModule", { value: true });
	stripeConfigOut.StripeConfigOutSerializer = void 0;
	stripeConfigOut.StripeConfigOutSerializer = {
	    _fromJsonObject(_object) {
	        return {};
	    },
	    _toJsonObject(_self) {
	        return {};
	    },
	};
	
	return stripeConfigOut;
}

var svixConfigOut = {};

var hasRequiredSvixConfigOut;

function requireSvixConfigOut () {
	if (hasRequiredSvixConfigOut) return svixConfigOut;
	hasRequiredSvixConfigOut = 1;
	Object.defineProperty(svixConfigOut, "__esModule", { value: true });
	svixConfigOut.SvixConfigOutSerializer = void 0;
	svixConfigOut.SvixConfigOutSerializer = {
	    _fromJsonObject(_object) {
	        return {};
	    },
	    _toJsonObject(_self) {
	        return {};
	    },
	};
	
	return svixConfigOut;
}

var telnyxConfigOut = {};

var hasRequiredTelnyxConfigOut;

function requireTelnyxConfigOut () {
	if (hasRequiredTelnyxConfigOut) return telnyxConfigOut;
	hasRequiredTelnyxConfigOut = 1;
	Object.defineProperty(telnyxConfigOut, "__esModule", { value: true });
	telnyxConfigOut.TelnyxConfigOutSerializer = void 0;
	telnyxConfigOut.TelnyxConfigOutSerializer = {
	    _fromJsonObject(object) {
	        return {
	            publicKey: object["publicKey"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            publicKey: self.publicKey,
	        };
	    },
	};
	
	return telnyxConfigOut;
}

var vapiConfigOut = {};

var hasRequiredVapiConfigOut;

function requireVapiConfigOut () {
	if (hasRequiredVapiConfigOut) return vapiConfigOut;
	hasRequiredVapiConfigOut = 1;
	Object.defineProperty(vapiConfigOut, "__esModule", { value: true });
	vapiConfigOut.VapiConfigOutSerializer = void 0;
	vapiConfigOut.VapiConfigOutSerializer = {
	    _fromJsonObject(_object) {
	        return {};
	    },
	    _toJsonObject(_self) {
	        return {};
	    },
	};
	
	return vapiConfigOut;
}

var veriffConfigOut = {};

var hasRequiredVeriffConfigOut;

function requireVeriffConfigOut () {
	if (hasRequiredVeriffConfigOut) return veriffConfigOut;
	hasRequiredVeriffConfigOut = 1;
	Object.defineProperty(veriffConfigOut, "__esModule", { value: true });
	veriffConfigOut.VeriffConfigOutSerializer = void 0;
	veriffConfigOut.VeriffConfigOutSerializer = {
	    _fromJsonObject(_object) {
	        return {};
	    },
	    _toJsonObject(_self) {
	        return {};
	    },
	};
	
	return veriffConfigOut;
}

var zoomConfigOut = {};

var hasRequiredZoomConfigOut;

function requireZoomConfigOut () {
	if (hasRequiredZoomConfigOut) return zoomConfigOut;
	hasRequiredZoomConfigOut = 1;
	Object.defineProperty(zoomConfigOut, "__esModule", { value: true });
	zoomConfigOut.ZoomConfigOutSerializer = void 0;
	zoomConfigOut.ZoomConfigOutSerializer = {
	    _fromJsonObject(_object) {
	        return {};
	    },
	    _toJsonObject(_self) {
	        return {};
	    },
	};
	
	return zoomConfigOut;
}

var hasRequiredIngestSourceOut;

function requireIngestSourceOut () {
	if (hasRequiredIngestSourceOut) return ingestSourceOut;
	hasRequiredIngestSourceOut = 1;
	Object.defineProperty(ingestSourceOut, "__esModule", { value: true });
	ingestSourceOut.IngestSourceOutSerializer = void 0;
	const adobeSignConfigOut_1 = requireAdobeSignConfigOut();
	const airwallexConfigOut_1 = requireAirwallexConfigOut();
	const checkbookConfigOut_1 = requireCheckbookConfigOut();
	const cronConfig_1 = requireCronConfig();
	const docusignConfigOut_1 = requireDocusignConfigOut();
	const easypostConfigOut_1 = requireEasypostConfigOut();
	const githubConfigOut_1 = requireGithubConfigOut();
	const hubspotConfigOut_1 = requireHubspotConfigOut();
	const metaConfigOut_1 = requireMetaConfigOut();
	const orumIoConfigOut_1 = requireOrumIoConfigOut();
	const pandaDocConfigOut_1 = requirePandaDocConfigOut();
	const portIoConfigOut_1 = requirePortIoConfigOut();
	const rutterConfigOut_1 = requireRutterConfigOut();
	const segmentConfigOut_1 = requireSegmentConfigOut();
	const shopifyConfigOut_1 = requireShopifyConfigOut();
	const slackConfigOut_1 = requireSlackConfigOut();
	const stripeConfigOut_1 = requireStripeConfigOut();
	const svixConfigOut_1 = requireSvixConfigOut();
	const telnyxConfigOut_1 = requireTelnyxConfigOut();
	const vapiConfigOut_1 = requireVapiConfigOut();
	const veriffConfigOut_1 = requireVeriffConfigOut();
	const zoomConfigOut_1 = requireZoomConfigOut();
	ingestSourceOut.IngestSourceOutSerializer = {
	    _fromJsonObject(object) {
	        const type = object["type"];
	        function getConfig(type) {
	            switch (type) {
	                case "generic-webhook":
	                    return {};
	                case "cron":
	                    return cronConfig_1.CronConfigSerializer._fromJsonObject(object["config"]);
	                case "adobe-sign":
	                    return adobeSignConfigOut_1.AdobeSignConfigOutSerializer._fromJsonObject(object["config"]);
	                case "beehiiv":
	                    return svixConfigOut_1.SvixConfigOutSerializer._fromJsonObject(object["config"]);
	                case "brex":
	                    return svixConfigOut_1.SvixConfigOutSerializer._fromJsonObject(object["config"]);
	                case "checkbook":
	                    return checkbookConfigOut_1.CheckbookConfigOutSerializer._fromJsonObject(object["config"]);
	                case "clerk":
	                    return svixConfigOut_1.SvixConfigOutSerializer._fromJsonObject(object["config"]);
	                case "docusign":
	                    return docusignConfigOut_1.DocusignConfigOutSerializer._fromJsonObject(object["config"]);
	                case "easypost":
	                    return easypostConfigOut_1.EasypostConfigOutSerializer._fromJsonObject(object["config"]);
	                case "github":
	                    return githubConfigOut_1.GithubConfigOutSerializer._fromJsonObject(object["config"]);
	                case "guesty":
	                    return svixConfigOut_1.SvixConfigOutSerializer._fromJsonObject(object["config"]);
	                case "hubspot":
	                    return hubspotConfigOut_1.HubspotConfigOutSerializer._fromJsonObject(object["config"]);
	                case "incident-io":
	                    return svixConfigOut_1.SvixConfigOutSerializer._fromJsonObject(object["config"]);
	                case "lithic":
	                    return svixConfigOut_1.SvixConfigOutSerializer._fromJsonObject(object["config"]);
	                case "meta":
	                    return metaConfigOut_1.MetaConfigOutSerializer._fromJsonObject(object["config"]);
	                case "nash":
	                    return svixConfigOut_1.SvixConfigOutSerializer._fromJsonObject(object["config"]);
	                case "orum-io":
	                    return orumIoConfigOut_1.OrumIoConfigOutSerializer._fromJsonObject(object["config"]);
	                case "panda-doc":
	                    return pandaDocConfigOut_1.PandaDocConfigOutSerializer._fromJsonObject(object["config"]);
	                case "port-io":
	                    return portIoConfigOut_1.PortIoConfigOutSerializer._fromJsonObject(object["config"]);
	                case "psi-fi":
	                    return svixConfigOut_1.SvixConfigOutSerializer._fromJsonObject(object["config"]);
	                case "pleo":
	                    return svixConfigOut_1.SvixConfigOutSerializer._fromJsonObject(object["config"]);
	                case "replicate":
	                    return svixConfigOut_1.SvixConfigOutSerializer._fromJsonObject(object["config"]);
	                case "resend":
	                    return svixConfigOut_1.SvixConfigOutSerializer._fromJsonObject(object["config"]);
	                case "rutter":
	                    return rutterConfigOut_1.RutterConfigOutSerializer._fromJsonObject(object["config"]);
	                case "safebase":
	                    return svixConfigOut_1.SvixConfigOutSerializer._fromJsonObject(object["config"]);
	                case "sardine":
	                    return svixConfigOut_1.SvixConfigOutSerializer._fromJsonObject(object["config"]);
	                case "segment":
	                    return segmentConfigOut_1.SegmentConfigOutSerializer._fromJsonObject(object["config"]);
	                case "shopify":
	                    return shopifyConfigOut_1.ShopifyConfigOutSerializer._fromJsonObject(object["config"]);
	                case "slack":
	                    return slackConfigOut_1.SlackConfigOutSerializer._fromJsonObject(object["config"]);
	                case "stripe":
	                    return stripeConfigOut_1.StripeConfigOutSerializer._fromJsonObject(object["config"]);
	                case "stych":
	                    return svixConfigOut_1.SvixConfigOutSerializer._fromJsonObject(object["config"]);
	                case "svix":
	                    return svixConfigOut_1.SvixConfigOutSerializer._fromJsonObject(object["config"]);
	                case "zoom":
	                    return zoomConfigOut_1.ZoomConfigOutSerializer._fromJsonObject(object["config"]);
	                case "telnyx":
	                    return telnyxConfigOut_1.TelnyxConfigOutSerializer._fromJsonObject(object["config"]);
	                case "vapi":
	                    return vapiConfigOut_1.VapiConfigOutSerializer._fromJsonObject(object["config"]);
	                case "open-ai":
	                    return svixConfigOut_1.SvixConfigOutSerializer._fromJsonObject(object["config"]);
	                case "render":
	                    return svixConfigOut_1.SvixConfigOutSerializer._fromJsonObject(object["config"]);
	                case "veriff":
	                    return veriffConfigOut_1.VeriffConfigOutSerializer._fromJsonObject(object["config"]);
	                case "airwallex":
	                    return airwallexConfigOut_1.AirwallexConfigOutSerializer._fromJsonObject(object["config"]);
	                default:
	                    throw new Error(`Unexpected type: ${type}`);
	            }
	        }
	        return {
	            type,
	            config: getConfig(type),
	            createdAt: new Date(object["createdAt"]),
	            id: object["id"],
	            ingestUrl: object["ingestUrl"],
	            metadata: object["metadata"],
	            name: object["name"],
	            uid: object["uid"],
	            updatedAt: new Date(object["updatedAt"]),
	        };
	    },
	    _toJsonObject(self) {
	        let config;
	        switch (self.type) {
	            case "generic-webhook":
	                config = {};
	                break;
	            case "cron":
	                config = cronConfig_1.CronConfigSerializer._toJsonObject(self.config);
	                break;
	            case "adobe-sign":
	                config = adobeSignConfigOut_1.AdobeSignConfigOutSerializer._toJsonObject(self.config);
	                break;
	            case "beehiiv":
	                config = svixConfigOut_1.SvixConfigOutSerializer._toJsonObject(self.config);
	                break;
	            case "brex":
	                config = svixConfigOut_1.SvixConfigOutSerializer._toJsonObject(self.config);
	                break;
	            case "checkbook":
	                config = checkbookConfigOut_1.CheckbookConfigOutSerializer._toJsonObject(self.config);
	                break;
	            case "clerk":
	                config = svixConfigOut_1.SvixConfigOutSerializer._toJsonObject(self.config);
	                break;
	            case "docusign":
	                config = docusignConfigOut_1.DocusignConfigOutSerializer._toJsonObject(self.config);
	                break;
	            case "easypost":
	                config = easypostConfigOut_1.EasypostConfigOutSerializer._toJsonObject(self.config);
	                break;
	            case "github":
	                config = githubConfigOut_1.GithubConfigOutSerializer._toJsonObject(self.config);
	                break;
	            case "guesty":
	                config = svixConfigOut_1.SvixConfigOutSerializer._toJsonObject(self.config);
	                break;
	            case "hubspot":
	                config = hubspotConfigOut_1.HubspotConfigOutSerializer._toJsonObject(self.config);
	                break;
	            case "incident-io":
	                config = svixConfigOut_1.SvixConfigOutSerializer._toJsonObject(self.config);
	                break;
	            case "lithic":
	                config = svixConfigOut_1.SvixConfigOutSerializer._toJsonObject(self.config);
	                break;
	            case "meta":
	                config = metaConfigOut_1.MetaConfigOutSerializer._toJsonObject(self.config);
	                break;
	            case "nash":
	                config = svixConfigOut_1.SvixConfigOutSerializer._toJsonObject(self.config);
	                break;
	            case "orum-io":
	                config = orumIoConfigOut_1.OrumIoConfigOutSerializer._toJsonObject(self.config);
	                break;
	            case "panda-doc":
	                config = pandaDocConfigOut_1.PandaDocConfigOutSerializer._toJsonObject(self.config);
	                break;
	            case "port-io":
	                config = portIoConfigOut_1.PortIoConfigOutSerializer._toJsonObject(self.config);
	                break;
	            case "psi-fi":
	                config = svixConfigOut_1.SvixConfigOutSerializer._toJsonObject(self.config);
	                break;
	            case "pleo":
	                config = svixConfigOut_1.SvixConfigOutSerializer._toJsonObject(self.config);
	                break;
	            case "replicate":
	                config = svixConfigOut_1.SvixConfigOutSerializer._toJsonObject(self.config);
	                break;
	            case "resend":
	                config = svixConfigOut_1.SvixConfigOutSerializer._toJsonObject(self.config);
	                break;
	            case "rutter":
	                config = rutterConfigOut_1.RutterConfigOutSerializer._toJsonObject(self.config);
	                break;
	            case "safebase":
	                config = svixConfigOut_1.SvixConfigOutSerializer._toJsonObject(self.config);
	                break;
	            case "sardine":
	                config = svixConfigOut_1.SvixConfigOutSerializer._toJsonObject(self.config);
	                break;
	            case "segment":
	                config = segmentConfigOut_1.SegmentConfigOutSerializer._toJsonObject(self.config);
	                break;
	            case "shopify":
	                config = shopifyConfigOut_1.ShopifyConfigOutSerializer._toJsonObject(self.config);
	                break;
	            case "slack":
	                config = slackConfigOut_1.SlackConfigOutSerializer._toJsonObject(self.config);
	                break;
	            case "stripe":
	                config = stripeConfigOut_1.StripeConfigOutSerializer._toJsonObject(self.config);
	                break;
	            case "stych":
	                config = svixConfigOut_1.SvixConfigOutSerializer._toJsonObject(self.config);
	                break;
	            case "svix":
	                config = svixConfigOut_1.SvixConfigOutSerializer._toJsonObject(self.config);
	                break;
	            case "zoom":
	                config = zoomConfigOut_1.ZoomConfigOutSerializer._toJsonObject(self.config);
	                break;
	            case "telnyx":
	                config = telnyxConfigOut_1.TelnyxConfigOutSerializer._toJsonObject(self.config);
	                break;
	            case "vapi":
	                config = vapiConfigOut_1.VapiConfigOutSerializer._toJsonObject(self.config);
	                break;
	            case "open-ai":
	                config = svixConfigOut_1.SvixConfigOutSerializer._toJsonObject(self.config);
	                break;
	            case "render":
	                config = svixConfigOut_1.SvixConfigOutSerializer._toJsonObject(self.config);
	                break;
	            case "veriff":
	                config = veriffConfigOut_1.VeriffConfigOutSerializer._toJsonObject(self.config);
	                break;
	            case "airwallex":
	                config = airwallexConfigOut_1.AirwallexConfigOutSerializer._toJsonObject(self.config);
	                break;
	        }
	        return {
	            type: self.type,
	            config: config,
	            createdAt: self.createdAt,
	            id: self.id,
	            ingestUrl: self.ingestUrl,
	            metadata: self.metadata,
	            name: self.name,
	            uid: self.uid,
	            updatedAt: self.updatedAt,
	        };
	    },
	};
	
	return ingestSourceOut;
}

var listResponseIngestSourceOut = {};

var hasRequiredListResponseIngestSourceOut;

function requireListResponseIngestSourceOut () {
	if (hasRequiredListResponseIngestSourceOut) return listResponseIngestSourceOut;
	hasRequiredListResponseIngestSourceOut = 1;
	Object.defineProperty(listResponseIngestSourceOut, "__esModule", { value: true });
	listResponseIngestSourceOut.ListResponseIngestSourceOutSerializer = void 0;
	const ingestSourceOut_1 = requireIngestSourceOut();
	listResponseIngestSourceOut.ListResponseIngestSourceOutSerializer = {
	    _fromJsonObject(object) {
	        return {
	            data: object["data"].map((item) => ingestSourceOut_1.IngestSourceOutSerializer._fromJsonObject(item)),
	            done: object["done"],
	            iterator: object["iterator"],
	            prevIterator: object["prevIterator"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            data: self.data.map((item) => ingestSourceOut_1.IngestSourceOutSerializer._toJsonObject(item)),
	            done: self.done,
	            iterator: self.iterator,
	            prevIterator: self.prevIterator,
	        };
	    },
	};
	
	return listResponseIngestSourceOut;
}

var rotateTokenOut = {};

var hasRequiredRotateTokenOut;

function requireRotateTokenOut () {
	if (hasRequiredRotateTokenOut) return rotateTokenOut;
	hasRequiredRotateTokenOut = 1;
	Object.defineProperty(rotateTokenOut, "__esModule", { value: true });
	rotateTokenOut.RotateTokenOutSerializer = void 0;
	rotateTokenOut.RotateTokenOutSerializer = {
	    _fromJsonObject(object) {
	        return {
	            ingestUrl: object["ingestUrl"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            ingestUrl: self.ingestUrl,
	        };
	    },
	};
	
	return rotateTokenOut;
}

var hasRequiredIngestSource;

function requireIngestSource () {
	if (hasRequiredIngestSource) return ingestSource;
	hasRequiredIngestSource = 1;
	Object.defineProperty(ingestSource, "__esModule", { value: true });
	ingestSource.IngestSource = void 0;
	const ingestSourceIn_1 = requireIngestSourceIn();
	const ingestSourceOut_1 = requireIngestSourceOut();
	const listResponseIngestSourceOut_1 = requireListResponseIngestSourceOut();
	const rotateTokenOut_1 = requireRotateTokenOut();
	const request_1 = requireRequest();
	class IngestSource {
	    constructor(requestCtx) {
	        this.requestCtx = requestCtx;
	    }
	    list(options) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/ingest/api/v1/source");
	        request.setQueryParams({
	            limit: options === null || options === void 0 ? void 0 : options.limit,
	            iterator: options === null || options === void 0 ? void 0 : options.iterator,
	            order: options === null || options === void 0 ? void 0 : options.order,
	        });
	        return request.send(this.requestCtx, listResponseIngestSourceOut_1.ListResponseIngestSourceOutSerializer._fromJsonObject);
	    }
	    create(ingestSourceIn, options) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/ingest/api/v1/source");
	        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
	        request.setBody(ingestSourceIn_1.IngestSourceInSerializer._toJsonObject(ingestSourceIn));
	        return request.send(this.requestCtx, ingestSourceOut_1.IngestSourceOutSerializer._fromJsonObject);
	    }
	    get(sourceId) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/ingest/api/v1/source/{source_id}");
	        request.setPathParam("source_id", sourceId);
	        return request.send(this.requestCtx, ingestSourceOut_1.IngestSourceOutSerializer._fromJsonObject);
	    }
	    update(sourceId, ingestSourceIn) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.PUT, "/ingest/api/v1/source/{source_id}");
	        request.setPathParam("source_id", sourceId);
	        request.setBody(ingestSourceIn_1.IngestSourceInSerializer._toJsonObject(ingestSourceIn));
	        return request.send(this.requestCtx, ingestSourceOut_1.IngestSourceOutSerializer._fromJsonObject);
	    }
	    delete(sourceId) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.DELETE, "/ingest/api/v1/source/{source_id}");
	        request.setPathParam("source_id", sourceId);
	        return request.sendNoResponseBody(this.requestCtx);
	    }
	    rotateToken(sourceId, options) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/ingest/api/v1/source/{source_id}/token/rotate");
	        request.setPathParam("source_id", sourceId);
	        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
	        return request.send(this.requestCtx, rotateTokenOut_1.RotateTokenOutSerializer._fromJsonObject);
	    }
	}
	ingestSource.IngestSource = IngestSource;
	
	return ingestSource;
}

var hasRequiredIngest;

function requireIngest () {
	if (hasRequiredIngest) return ingest;
	hasRequiredIngest = 1;
	Object.defineProperty(ingest, "__esModule", { value: true });
	ingest.Ingest = void 0;
	const dashboardAccessOut_1 = requireDashboardAccessOut();
	const ingestSourceConsumerPortalAccessIn_1 = requireIngestSourceConsumerPortalAccessIn();
	const ingestEndpoint_1 = requireIngestEndpoint();
	const ingestSource_1 = requireIngestSource();
	const request_1 = requireRequest();
	class Ingest {
	    constructor(requestCtx) {
	        this.requestCtx = requestCtx;
	    }
	    get endpoint() {
	        return new ingestEndpoint_1.IngestEndpoint(this.requestCtx);
	    }
	    get source() {
	        return new ingestSource_1.IngestSource(this.requestCtx);
	    }
	    dashboard(sourceId, ingestSourceConsumerPortalAccessIn, options) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/ingest/api/v1/source/{source_id}/dashboard");
	        request.setPathParam("source_id", sourceId);
	        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
	        request.setBody(ingestSourceConsumerPortalAccessIn_1.IngestSourceConsumerPortalAccessInSerializer._toJsonObject(ingestSourceConsumerPortalAccessIn));
	        return request.send(this.requestCtx, dashboardAccessOut_1.DashboardAccessOutSerializer._fromJsonObject);
	    }
	}
	ingest.Ingest = Ingest;
	
	return ingest;
}

var integration = {};

var integrationIn = {};

var hasRequiredIntegrationIn;

function requireIntegrationIn () {
	if (hasRequiredIntegrationIn) return integrationIn;
	hasRequiredIntegrationIn = 1;
	Object.defineProperty(integrationIn, "__esModule", { value: true });
	integrationIn.IntegrationInSerializer = void 0;
	integrationIn.IntegrationInSerializer = {
	    _fromJsonObject(object) {
	        return {
	            featureFlags: object["featureFlags"],
	            name: object["name"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            featureFlags: self.featureFlags,
	            name: self.name,
	        };
	    },
	};
	
	return integrationIn;
}

var integrationKeyOut = {};

var hasRequiredIntegrationKeyOut;

function requireIntegrationKeyOut () {
	if (hasRequiredIntegrationKeyOut) return integrationKeyOut;
	hasRequiredIntegrationKeyOut = 1;
	Object.defineProperty(integrationKeyOut, "__esModule", { value: true });
	integrationKeyOut.IntegrationKeyOutSerializer = void 0;
	integrationKeyOut.IntegrationKeyOutSerializer = {
	    _fromJsonObject(object) {
	        return {
	            key: object["key"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            key: self.key,
	        };
	    },
	};
	
	return integrationKeyOut;
}

var integrationOut = {};

var hasRequiredIntegrationOut;

function requireIntegrationOut () {
	if (hasRequiredIntegrationOut) return integrationOut;
	hasRequiredIntegrationOut = 1;
	Object.defineProperty(integrationOut, "__esModule", { value: true });
	integrationOut.IntegrationOutSerializer = void 0;
	integrationOut.IntegrationOutSerializer = {
	    _fromJsonObject(object) {
	        return {
	            createdAt: new Date(object["createdAt"]),
	            featureFlags: object["featureFlags"],
	            id: object["id"],
	            name: object["name"],
	            updatedAt: new Date(object["updatedAt"]),
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            createdAt: self.createdAt,
	            featureFlags: self.featureFlags,
	            id: self.id,
	            name: self.name,
	            updatedAt: self.updatedAt,
	        };
	    },
	};
	
	return integrationOut;
}

var integrationUpdate = {};

var hasRequiredIntegrationUpdate;

function requireIntegrationUpdate () {
	if (hasRequiredIntegrationUpdate) return integrationUpdate;
	hasRequiredIntegrationUpdate = 1;
	Object.defineProperty(integrationUpdate, "__esModule", { value: true });
	integrationUpdate.IntegrationUpdateSerializer = void 0;
	integrationUpdate.IntegrationUpdateSerializer = {
	    _fromJsonObject(object) {
	        return {
	            featureFlags: object["featureFlags"],
	            name: object["name"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            featureFlags: self.featureFlags,
	            name: self.name,
	        };
	    },
	};
	
	return integrationUpdate;
}

var listResponseIntegrationOut = {};

var hasRequiredListResponseIntegrationOut;

function requireListResponseIntegrationOut () {
	if (hasRequiredListResponseIntegrationOut) return listResponseIntegrationOut;
	hasRequiredListResponseIntegrationOut = 1;
	Object.defineProperty(listResponseIntegrationOut, "__esModule", { value: true });
	listResponseIntegrationOut.ListResponseIntegrationOutSerializer = void 0;
	const integrationOut_1 = requireIntegrationOut();
	listResponseIntegrationOut.ListResponseIntegrationOutSerializer = {
	    _fromJsonObject(object) {
	        return {
	            data: object["data"].map((item) => integrationOut_1.IntegrationOutSerializer._fromJsonObject(item)),
	            done: object["done"],
	            iterator: object["iterator"],
	            prevIterator: object["prevIterator"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            data: self.data.map((item) => integrationOut_1.IntegrationOutSerializer._toJsonObject(item)),
	            done: self.done,
	            iterator: self.iterator,
	            prevIterator: self.prevIterator,
	        };
	    },
	};
	
	return listResponseIntegrationOut;
}

var hasRequiredIntegration;

function requireIntegration () {
	if (hasRequiredIntegration) return integration;
	hasRequiredIntegration = 1;
	Object.defineProperty(integration, "__esModule", { value: true });
	integration.Integration = void 0;
	const integrationIn_1 = requireIntegrationIn();
	const integrationKeyOut_1 = requireIntegrationKeyOut();
	const integrationOut_1 = requireIntegrationOut();
	const integrationUpdate_1 = requireIntegrationUpdate();
	const listResponseIntegrationOut_1 = requireListResponseIntegrationOut();
	const request_1 = requireRequest();
	class Integration {
	    constructor(requestCtx) {
	        this.requestCtx = requestCtx;
	    }
	    list(appId, options) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/app/{app_id}/integration");
	        request.setPathParam("app_id", appId);
	        request.setQueryParams({
	            limit: options === null || options === void 0 ? void 0 : options.limit,
	            iterator: options === null || options === void 0 ? void 0 : options.iterator,
	            order: options === null || options === void 0 ? void 0 : options.order,
	        });
	        return request.send(this.requestCtx, listResponseIntegrationOut_1.ListResponseIntegrationOutSerializer._fromJsonObject);
	    }
	    create(appId, integrationIn, options) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/app/{app_id}/integration");
	        request.setPathParam("app_id", appId);
	        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
	        request.setBody(integrationIn_1.IntegrationInSerializer._toJsonObject(integrationIn));
	        return request.send(this.requestCtx, integrationOut_1.IntegrationOutSerializer._fromJsonObject);
	    }
	    get(appId, integId) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/app/{app_id}/integration/{integ_id}");
	        request.setPathParam("app_id", appId);
	        request.setPathParam("integ_id", integId);
	        return request.send(this.requestCtx, integrationOut_1.IntegrationOutSerializer._fromJsonObject);
	    }
	    update(appId, integId, integrationUpdate) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.PUT, "/api/v1/app/{app_id}/integration/{integ_id}");
	        request.setPathParam("app_id", appId);
	        request.setPathParam("integ_id", integId);
	        request.setBody(integrationUpdate_1.IntegrationUpdateSerializer._toJsonObject(integrationUpdate));
	        return request.send(this.requestCtx, integrationOut_1.IntegrationOutSerializer._fromJsonObject);
	    }
	    delete(appId, integId) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.DELETE, "/api/v1/app/{app_id}/integration/{integ_id}");
	        request.setPathParam("app_id", appId);
	        request.setPathParam("integ_id", integId);
	        return request.sendNoResponseBody(this.requestCtx);
	    }
	    getKey(appId, integId) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/app/{app_id}/integration/{integ_id}/key");
	        request.setPathParam("app_id", appId);
	        request.setPathParam("integ_id", integId);
	        return request.send(this.requestCtx, integrationKeyOut_1.IntegrationKeyOutSerializer._fromJsonObject);
	    }
	    rotateKey(appId, integId, options) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/app/{app_id}/integration/{integ_id}/key/rotate");
	        request.setPathParam("app_id", appId);
	        request.setPathParam("integ_id", integId);
	        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
	        return request.send(this.requestCtx, integrationKeyOut_1.IntegrationKeyOutSerializer._fromJsonObject);
	    }
	}
	integration.Integration = Integration;
	
	return integration;
}

var message = {};

var expungeAllContentsOut = {};

var hasRequiredExpungeAllContentsOut;

function requireExpungeAllContentsOut () {
	if (hasRequiredExpungeAllContentsOut) return expungeAllContentsOut;
	hasRequiredExpungeAllContentsOut = 1;
	Object.defineProperty(expungeAllContentsOut, "__esModule", { value: true });
	expungeAllContentsOut.ExpungeAllContentsOutSerializer = void 0;
	const backgroundTaskStatus_1 = requireBackgroundTaskStatus();
	const backgroundTaskType_1 = requireBackgroundTaskType();
	expungeAllContentsOut.ExpungeAllContentsOutSerializer = {
	    _fromJsonObject(object) {
	        return {
	            id: object["id"],
	            status: backgroundTaskStatus_1.BackgroundTaskStatusSerializer._fromJsonObject(object["status"]),
	            task: backgroundTaskType_1.BackgroundTaskTypeSerializer._fromJsonObject(object["task"]),
	            updatedAt: new Date(object["updatedAt"]),
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            id: self.id,
	            status: backgroundTaskStatus_1.BackgroundTaskStatusSerializer._toJsonObject(self.status),
	            task: backgroundTaskType_1.BackgroundTaskTypeSerializer._toJsonObject(self.task),
	            updatedAt: self.updatedAt,
	        };
	    },
	};
	
	return expungeAllContentsOut;
}

var listResponseMessageOut = {};

var hasRequiredListResponseMessageOut;

function requireListResponseMessageOut () {
	if (hasRequiredListResponseMessageOut) return listResponseMessageOut;
	hasRequiredListResponseMessageOut = 1;
	Object.defineProperty(listResponseMessageOut, "__esModule", { value: true });
	listResponseMessageOut.ListResponseMessageOutSerializer = void 0;
	const messageOut_1 = requireMessageOut();
	listResponseMessageOut.ListResponseMessageOutSerializer = {
	    _fromJsonObject(object) {
	        return {
	            data: object["data"].map((item) => messageOut_1.MessageOutSerializer._fromJsonObject(item)),
	            done: object["done"],
	            iterator: object["iterator"],
	            prevIterator: object["prevIterator"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            data: self.data.map((item) => messageOut_1.MessageOutSerializer._toJsonObject(item)),
	            done: self.done,
	            iterator: self.iterator,
	            prevIterator: self.prevIterator,
	        };
	    },
	};
	
	return listResponseMessageOut;
}

var messagePrecheckIn = {};

var hasRequiredMessagePrecheckIn;

function requireMessagePrecheckIn () {
	if (hasRequiredMessagePrecheckIn) return messagePrecheckIn;
	hasRequiredMessagePrecheckIn = 1;
	Object.defineProperty(messagePrecheckIn, "__esModule", { value: true });
	messagePrecheckIn.MessagePrecheckInSerializer = void 0;
	messagePrecheckIn.MessagePrecheckInSerializer = {
	    _fromJsonObject(object) {
	        return {
	            channels: object["channels"],
	            eventType: object["eventType"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            channels: self.channels,
	            eventType: self.eventType,
	        };
	    },
	};
	
	return messagePrecheckIn;
}

var messagePrecheckOut = {};

var hasRequiredMessagePrecheckOut;

function requireMessagePrecheckOut () {
	if (hasRequiredMessagePrecheckOut) return messagePrecheckOut;
	hasRequiredMessagePrecheckOut = 1;
	Object.defineProperty(messagePrecheckOut, "__esModule", { value: true });
	messagePrecheckOut.MessagePrecheckOutSerializer = void 0;
	messagePrecheckOut.MessagePrecheckOutSerializer = {
	    _fromJsonObject(object) {
	        return {
	            active: object["active"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            active: self.active,
	        };
	    },
	};
	
	return messagePrecheckOut;
}

var messagePoller = {};

var pollingEndpointConsumerSeekIn = {};

var hasRequiredPollingEndpointConsumerSeekIn;

function requirePollingEndpointConsumerSeekIn () {
	if (hasRequiredPollingEndpointConsumerSeekIn) return pollingEndpointConsumerSeekIn;
	hasRequiredPollingEndpointConsumerSeekIn = 1;
	Object.defineProperty(pollingEndpointConsumerSeekIn, "__esModule", { value: true });
	pollingEndpointConsumerSeekIn.PollingEndpointConsumerSeekInSerializer = void 0;
	pollingEndpointConsumerSeekIn.PollingEndpointConsumerSeekInSerializer = {
	    _fromJsonObject(object) {
	        return {
	            after: new Date(object["after"]),
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            after: self.after,
	        };
	    },
	};
	
	return pollingEndpointConsumerSeekIn;
}

var pollingEndpointConsumerSeekOut = {};

var hasRequiredPollingEndpointConsumerSeekOut;

function requirePollingEndpointConsumerSeekOut () {
	if (hasRequiredPollingEndpointConsumerSeekOut) return pollingEndpointConsumerSeekOut;
	hasRequiredPollingEndpointConsumerSeekOut = 1;
	Object.defineProperty(pollingEndpointConsumerSeekOut, "__esModule", { value: true });
	pollingEndpointConsumerSeekOut.PollingEndpointConsumerSeekOutSerializer = void 0;
	pollingEndpointConsumerSeekOut.PollingEndpointConsumerSeekOutSerializer = {
	    _fromJsonObject(object) {
	        return {
	            iterator: object["iterator"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            iterator: self.iterator,
	        };
	    },
	};
	
	return pollingEndpointConsumerSeekOut;
}

var pollingEndpointOut = {};

var pollingEndpointMessageOut = {};

var hasRequiredPollingEndpointMessageOut;

function requirePollingEndpointMessageOut () {
	if (hasRequiredPollingEndpointMessageOut) return pollingEndpointMessageOut;
	hasRequiredPollingEndpointMessageOut = 1;
	Object.defineProperty(pollingEndpointMessageOut, "__esModule", { value: true });
	pollingEndpointMessageOut.PollingEndpointMessageOutSerializer = void 0;
	pollingEndpointMessageOut.PollingEndpointMessageOutSerializer = {
	    _fromJsonObject(object) {
	        return {
	            channels: object["channels"],
	            deliverAt: object["deliverAt"] ? new Date(object["deliverAt"]) : null,
	            eventId: object["eventId"],
	            eventType: object["eventType"],
	            headers: object["headers"],
	            id: object["id"],
	            payload: object["payload"],
	            tags: object["tags"],
	            timestamp: new Date(object["timestamp"]),
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            channels: self.channels,
	            deliverAt: self.deliverAt,
	            eventId: self.eventId,
	            eventType: self.eventType,
	            headers: self.headers,
	            id: self.id,
	            payload: self.payload,
	            tags: self.tags,
	            timestamp: self.timestamp,
	        };
	    },
	};
	
	return pollingEndpointMessageOut;
}

var hasRequiredPollingEndpointOut;

function requirePollingEndpointOut () {
	if (hasRequiredPollingEndpointOut) return pollingEndpointOut;
	hasRequiredPollingEndpointOut = 1;
	Object.defineProperty(pollingEndpointOut, "__esModule", { value: true });
	pollingEndpointOut.PollingEndpointOutSerializer = void 0;
	const pollingEndpointMessageOut_1 = requirePollingEndpointMessageOut();
	pollingEndpointOut.PollingEndpointOutSerializer = {
	    _fromJsonObject(object) {
	        return {
	            data: object["data"].map((item) => pollingEndpointMessageOut_1.PollingEndpointMessageOutSerializer._fromJsonObject(item)),
	            done: object["done"],
	            iterator: object["iterator"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            data: self.data.map((item) => pollingEndpointMessageOut_1.PollingEndpointMessageOutSerializer._toJsonObject(item)),
	            done: self.done,
	            iterator: self.iterator,
	        };
	    },
	};
	
	return pollingEndpointOut;
}

var hasRequiredMessagePoller;

function requireMessagePoller () {
	if (hasRequiredMessagePoller) return messagePoller;
	hasRequiredMessagePoller = 1;
	Object.defineProperty(messagePoller, "__esModule", { value: true });
	messagePoller.MessagePoller = void 0;
	const pollingEndpointConsumerSeekIn_1 = requirePollingEndpointConsumerSeekIn();
	const pollingEndpointConsumerSeekOut_1 = requirePollingEndpointConsumerSeekOut();
	const pollingEndpointOut_1 = requirePollingEndpointOut();
	const request_1 = requireRequest();
	class MessagePoller {
	    constructor(requestCtx) {
	        this.requestCtx = requestCtx;
	    }
	    poll(appId, sinkId, options) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/app/{app_id}/poller/{sink_id}");
	        request.setPathParam("app_id", appId);
	        request.setPathParam("sink_id", sinkId);
	        request.setQueryParams({
	            limit: options === null || options === void 0 ? void 0 : options.limit,
	            iterator: options === null || options === void 0 ? void 0 : options.iterator,
	            event_type: options === null || options === void 0 ? void 0 : options.eventType,
	            channel: options === null || options === void 0 ? void 0 : options.channel,
	            after: options === null || options === void 0 ? void 0 : options.after,
	        });
	        return request.send(this.requestCtx, pollingEndpointOut_1.PollingEndpointOutSerializer._fromJsonObject);
	    }
	    consumerPoll(appId, sinkId, consumerId, options) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/app/{app_id}/poller/{sink_id}/consumer/{consumer_id}");
	        request.setPathParam("app_id", appId);
	        request.setPathParam("sink_id", sinkId);
	        request.setPathParam("consumer_id", consumerId);
	        request.setQueryParams({
	            limit: options === null || options === void 0 ? void 0 : options.limit,
	            iterator: options === null || options === void 0 ? void 0 : options.iterator,
	        });
	        return request.send(this.requestCtx, pollingEndpointOut_1.PollingEndpointOutSerializer._fromJsonObject);
	    }
	    consumerSeek(appId, sinkId, consumerId, pollingEndpointConsumerSeekIn, options) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/app/{app_id}/poller/{sink_id}/consumer/{consumer_id}/seek");
	        request.setPathParam("app_id", appId);
	        request.setPathParam("sink_id", sinkId);
	        request.setPathParam("consumer_id", consumerId);
	        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
	        request.setBody(pollingEndpointConsumerSeekIn_1.PollingEndpointConsumerSeekInSerializer._toJsonObject(pollingEndpointConsumerSeekIn));
	        return request.send(this.requestCtx, pollingEndpointConsumerSeekOut_1.PollingEndpointConsumerSeekOutSerializer._fromJsonObject);
	    }
	}
	messagePoller.MessagePoller = MessagePoller;
	
	return messagePoller;
}

var messageIn = {};

var hasRequiredMessageIn;

function requireMessageIn () {
	if (hasRequiredMessageIn) return messageIn;
	hasRequiredMessageIn = 1;
	Object.defineProperty(messageIn, "__esModule", { value: true });
	messageIn.MessageInSerializer = void 0;
	const applicationIn_1 = requireApplicationIn();
	messageIn.MessageInSerializer = {
	    _fromJsonObject(object) {
	        return {
	            application: object["application"] != null
	                ? applicationIn_1.ApplicationInSerializer._fromJsonObject(object["application"])
	                : undefined,
	            channels: object["channels"],
	            deliverAt: object["deliverAt"] ? new Date(object["deliverAt"]) : null,
	            eventId: object["eventId"],
	            eventType: object["eventType"],
	            payload: object["payload"],
	            payloadRetentionHours: object["payloadRetentionHours"],
	            payloadRetentionPeriod: object["payloadRetentionPeriod"],
	            tags: object["tags"],
	            transformationsParams: object["transformationsParams"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            application: self.application != null
	                ? applicationIn_1.ApplicationInSerializer._toJsonObject(self.application)
	                : undefined,
	            channels: self.channels,
	            deliverAt: self.deliverAt,
	            eventId: self.eventId,
	            eventType: self.eventType,
	            payload: self.payload,
	            payloadRetentionHours: self.payloadRetentionHours,
	            payloadRetentionPeriod: self.payloadRetentionPeriod,
	            tags: self.tags,
	            transformationsParams: self.transformationsParams,
	        };
	    },
	};
	
	return messageIn;
}

var hasRequiredMessage;

function requireMessage () {
	if (hasRequiredMessage) return message;
	hasRequiredMessage = 1;
	Object.defineProperty(message, "__esModule", { value: true });
	message.messageInRaw = message.Message = void 0;
	const expungeAllContentsOut_1 = requireExpungeAllContentsOut();
	const listResponseMessageOut_1 = requireListResponseMessageOut();
	const messageOut_1 = requireMessageOut();
	const messagePrecheckIn_1 = requireMessagePrecheckIn();
	const messagePrecheckOut_1 = requireMessagePrecheckOut();
	const messagePoller_1 = requireMessagePoller();
	const request_1 = requireRequest();
	const messageIn_1 = requireMessageIn();
	class Message {
	    constructor(requestCtx) {
	        this.requestCtx = requestCtx;
	    }
	    get poller() {
	        return new messagePoller_1.MessagePoller(this.requestCtx);
	    }
	    list(appId, options) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/app/{app_id}/msg");
	        request.setPathParam("app_id", appId);
	        request.setQueryParams({
	            limit: options === null || options === void 0 ? void 0 : options.limit,
	            iterator: options === null || options === void 0 ? void 0 : options.iterator,
	            channel: options === null || options === void 0 ? void 0 : options.channel,
	            before: options === null || options === void 0 ? void 0 : options.before,
	            after: options === null || options === void 0 ? void 0 : options.after,
	            with_content: options === null || options === void 0 ? void 0 : options.withContent,
	            tag: options === null || options === void 0 ? void 0 : options.tag,
	            event_types: options === null || options === void 0 ? void 0 : options.eventTypes,
	        });
	        return request.send(this.requestCtx, listResponseMessageOut_1.ListResponseMessageOutSerializer._fromJsonObject);
	    }
	    create(appId, messageIn, options) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/app/{app_id}/msg");
	        request.setPathParam("app_id", appId);
	        request.setQueryParams({
	            with_content: options === null || options === void 0 ? void 0 : options.withContent,
	        });
	        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
	        request.setBody(messageIn_1.MessageInSerializer._toJsonObject(messageIn));
	        return request.send(this.requestCtx, messageOut_1.MessageOutSerializer._fromJsonObject);
	    }
	    expungeAllContents(appId, options) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/app/{app_id}/msg/expunge-all-contents");
	        request.setPathParam("app_id", appId);
	        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
	        return request.send(this.requestCtx, expungeAllContentsOut_1.ExpungeAllContentsOutSerializer._fromJsonObject);
	    }
	    precheck(appId, messagePrecheckIn, options) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/app/{app_id}/msg/precheck/active");
	        request.setPathParam("app_id", appId);
	        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
	        request.setBody(messagePrecheckIn_1.MessagePrecheckInSerializer._toJsonObject(messagePrecheckIn));
	        return request.send(this.requestCtx, messagePrecheckOut_1.MessagePrecheckOutSerializer._fromJsonObject);
	    }
	    get(appId, msgId, options) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/app/{app_id}/msg/{msg_id}");
	        request.setPathParam("app_id", appId);
	        request.setPathParam("msg_id", msgId);
	        request.setQueryParams({
	            with_content: options === null || options === void 0 ? void 0 : options.withContent,
	        });
	        return request.send(this.requestCtx, messageOut_1.MessageOutSerializer._fromJsonObject);
	    }
	    expungeContent(appId, msgId) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.DELETE, "/api/v1/app/{app_id}/msg/{msg_id}/content");
	        request.setPathParam("app_id", appId);
	        request.setPathParam("msg_id", msgId);
	        return request.sendNoResponseBody(this.requestCtx);
	    }
	}
	message.Message = Message;
	function messageInRaw(eventType, payload, contentType) {
	    const headers = contentType ? { "content-type": contentType } : undefined;
	    return {
	        eventType,
	        payload: {},
	        transformationsParams: {
	            rawPayload: payload,
	            headers,
	        },
	    };
	}
	message.messageInRaw = messageInRaw;
	
	return message;
}

var messageAttempt = {};

var emptyResponse = {};

var hasRequiredEmptyResponse;

function requireEmptyResponse () {
	if (hasRequiredEmptyResponse) return emptyResponse;
	hasRequiredEmptyResponse = 1;
	Object.defineProperty(emptyResponse, "__esModule", { value: true });
	emptyResponse.EmptyResponseSerializer = void 0;
	emptyResponse.EmptyResponseSerializer = {
	    _fromJsonObject(_object) {
	        return {};
	    },
	    _toJsonObject(_self) {
	        return {};
	    },
	};
	
	return emptyResponse;
}

var listResponseEndpointMessageOut = {};

var endpointMessageOut = {};

var messageStatusText = {};

var hasRequiredMessageStatusText;

function requireMessageStatusText () {
	if (hasRequiredMessageStatusText) return messageStatusText;
	hasRequiredMessageStatusText = 1;
	(function (exports$1) {
		Object.defineProperty(exports$1, "__esModule", { value: true });
		exports$1.MessageStatusTextSerializer = exports$1.MessageStatusText = void 0;
		(function (MessageStatusText) {
		    MessageStatusText["Success"] = "success";
		    MessageStatusText["Pending"] = "pending";
		    MessageStatusText["Fail"] = "fail";
		    MessageStatusText["Sending"] = "sending";
		})(exports$1.MessageStatusText || (exports$1.MessageStatusText = {}));
		exports$1.MessageStatusTextSerializer = {
		    _fromJsonObject(object) {
		        return object;
		    },
		    _toJsonObject(self) {
		        return self;
		    },
		};
		
	} (messageStatusText));
	return messageStatusText;
}

var hasRequiredEndpointMessageOut;

function requireEndpointMessageOut () {
	if (hasRequiredEndpointMessageOut) return endpointMessageOut;
	hasRequiredEndpointMessageOut = 1;
	Object.defineProperty(endpointMessageOut, "__esModule", { value: true });
	endpointMessageOut.EndpointMessageOutSerializer = void 0;
	const messageStatus_1 = requireMessageStatus();
	const messageStatusText_1 = requireMessageStatusText();
	endpointMessageOut.EndpointMessageOutSerializer = {
	    _fromJsonObject(object) {
	        return {
	            channels: object["channels"],
	            deliverAt: object["deliverAt"] ? new Date(object["deliverAt"]) : null,
	            eventId: object["eventId"],
	            eventType: object["eventType"],
	            id: object["id"],
	            nextAttempt: object["nextAttempt"] ? new Date(object["nextAttempt"]) : null,
	            payload: object["payload"],
	            status: messageStatus_1.MessageStatusSerializer._fromJsonObject(object["status"]),
	            statusText: messageStatusText_1.MessageStatusTextSerializer._fromJsonObject(object["statusText"]),
	            tags: object["tags"],
	            timestamp: new Date(object["timestamp"]),
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            channels: self.channels,
	            deliverAt: self.deliverAt,
	            eventId: self.eventId,
	            eventType: self.eventType,
	            id: self.id,
	            nextAttempt: self.nextAttempt,
	            payload: self.payload,
	            status: messageStatus_1.MessageStatusSerializer._toJsonObject(self.status),
	            statusText: messageStatusText_1.MessageStatusTextSerializer._toJsonObject(self.statusText),
	            tags: self.tags,
	            timestamp: self.timestamp,
	        };
	    },
	};
	
	return endpointMessageOut;
}

var hasRequiredListResponseEndpointMessageOut;

function requireListResponseEndpointMessageOut () {
	if (hasRequiredListResponseEndpointMessageOut) return listResponseEndpointMessageOut;
	hasRequiredListResponseEndpointMessageOut = 1;
	Object.defineProperty(listResponseEndpointMessageOut, "__esModule", { value: true });
	listResponseEndpointMessageOut.ListResponseEndpointMessageOutSerializer = void 0;
	const endpointMessageOut_1 = requireEndpointMessageOut();
	listResponseEndpointMessageOut.ListResponseEndpointMessageOutSerializer = {
	    _fromJsonObject(object) {
	        return {
	            data: object["data"].map((item) => endpointMessageOut_1.EndpointMessageOutSerializer._fromJsonObject(item)),
	            done: object["done"],
	            iterator: object["iterator"],
	            prevIterator: object["prevIterator"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            data: self.data.map((item) => endpointMessageOut_1.EndpointMessageOutSerializer._toJsonObject(item)),
	            done: self.done,
	            iterator: self.iterator,
	            prevIterator: self.prevIterator,
	        };
	    },
	};
	
	return listResponseEndpointMessageOut;
}

var listResponseMessageAttemptOut = {};

var messageAttemptOut = {};

var messageAttemptTriggerType = {};

var hasRequiredMessageAttemptTriggerType;

function requireMessageAttemptTriggerType () {
	if (hasRequiredMessageAttemptTriggerType) return messageAttemptTriggerType;
	hasRequiredMessageAttemptTriggerType = 1;
	(function (exports$1) {
		Object.defineProperty(exports$1, "__esModule", { value: true });
		exports$1.MessageAttemptTriggerTypeSerializer = exports$1.MessageAttemptTriggerType = void 0;
		(function (MessageAttemptTriggerType) {
		    MessageAttemptTriggerType[MessageAttemptTriggerType["Scheduled"] = 0] = "Scheduled";
		    MessageAttemptTriggerType[MessageAttemptTriggerType["Manual"] = 1] = "Manual";
		})(exports$1.MessageAttemptTriggerType || (exports$1.MessageAttemptTriggerType = {}));
		exports$1.MessageAttemptTriggerTypeSerializer = {
		    _fromJsonObject(object) {
		        return object;
		    },
		    _toJsonObject(self) {
		        return self;
		    },
		};
		
	} (messageAttemptTriggerType));
	return messageAttemptTriggerType;
}

var hasRequiredMessageAttemptOut;

function requireMessageAttemptOut () {
	if (hasRequiredMessageAttemptOut) return messageAttemptOut;
	hasRequiredMessageAttemptOut = 1;
	Object.defineProperty(messageAttemptOut, "__esModule", { value: true });
	messageAttemptOut.MessageAttemptOutSerializer = void 0;
	const messageAttemptTriggerType_1 = requireMessageAttemptTriggerType();
	const messageOut_1 = requireMessageOut();
	const messageStatus_1 = requireMessageStatus();
	const messageStatusText_1 = requireMessageStatusText();
	messageAttemptOut.MessageAttemptOutSerializer = {
	    _fromJsonObject(object) {
	        return {
	            endpointId: object["endpointId"],
	            id: object["id"],
	            msg: object["msg"] != null
	                ? messageOut_1.MessageOutSerializer._fromJsonObject(object["msg"])
	                : undefined,
	            msgId: object["msgId"],
	            response: object["response"],
	            responseDurationMs: object["responseDurationMs"],
	            responseStatusCode: object["responseStatusCode"],
	            status: messageStatus_1.MessageStatusSerializer._fromJsonObject(object["status"]),
	            statusText: messageStatusText_1.MessageStatusTextSerializer._fromJsonObject(object["statusText"]),
	            timestamp: new Date(object["timestamp"]),
	            triggerType: messageAttemptTriggerType_1.MessageAttemptTriggerTypeSerializer._fromJsonObject(object["triggerType"]),
	            url: object["url"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            endpointId: self.endpointId,
	            id: self.id,
	            msg: self.msg != null ? messageOut_1.MessageOutSerializer._toJsonObject(self.msg) : undefined,
	            msgId: self.msgId,
	            response: self.response,
	            responseDurationMs: self.responseDurationMs,
	            responseStatusCode: self.responseStatusCode,
	            status: messageStatus_1.MessageStatusSerializer._toJsonObject(self.status),
	            statusText: messageStatusText_1.MessageStatusTextSerializer._toJsonObject(self.statusText),
	            timestamp: self.timestamp,
	            triggerType: messageAttemptTriggerType_1.MessageAttemptTriggerTypeSerializer._toJsonObject(self.triggerType),
	            url: self.url,
	        };
	    },
	};
	
	return messageAttemptOut;
}

var hasRequiredListResponseMessageAttemptOut;

function requireListResponseMessageAttemptOut () {
	if (hasRequiredListResponseMessageAttemptOut) return listResponseMessageAttemptOut;
	hasRequiredListResponseMessageAttemptOut = 1;
	Object.defineProperty(listResponseMessageAttemptOut, "__esModule", { value: true });
	listResponseMessageAttemptOut.ListResponseMessageAttemptOutSerializer = void 0;
	const messageAttemptOut_1 = requireMessageAttemptOut();
	listResponseMessageAttemptOut.ListResponseMessageAttemptOutSerializer = {
	    _fromJsonObject(object) {
	        return {
	            data: object["data"].map((item) => messageAttemptOut_1.MessageAttemptOutSerializer._fromJsonObject(item)),
	            done: object["done"],
	            iterator: object["iterator"],
	            prevIterator: object["prevIterator"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            data: self.data.map((item) => messageAttemptOut_1.MessageAttemptOutSerializer._toJsonObject(item)),
	            done: self.done,
	            iterator: self.iterator,
	            prevIterator: self.prevIterator,
	        };
	    },
	};
	
	return listResponseMessageAttemptOut;
}

var listResponseMessageEndpointOut = {};

var messageEndpointOut = {};

var hasRequiredMessageEndpointOut;

function requireMessageEndpointOut () {
	if (hasRequiredMessageEndpointOut) return messageEndpointOut;
	hasRequiredMessageEndpointOut = 1;
	Object.defineProperty(messageEndpointOut, "__esModule", { value: true });
	messageEndpointOut.MessageEndpointOutSerializer = void 0;
	const messageStatus_1 = requireMessageStatus();
	const messageStatusText_1 = requireMessageStatusText();
	messageEndpointOut.MessageEndpointOutSerializer = {
	    _fromJsonObject(object) {
	        return {
	            channels: object["channels"],
	            createdAt: new Date(object["createdAt"]),
	            description: object["description"],
	            disabled: object["disabled"],
	            filterTypes: object["filterTypes"],
	            id: object["id"],
	            nextAttempt: object["nextAttempt"] ? new Date(object["nextAttempt"]) : null,
	            rateLimit: object["rateLimit"],
	            status: messageStatus_1.MessageStatusSerializer._fromJsonObject(object["status"]),
	            statusText: messageStatusText_1.MessageStatusTextSerializer._fromJsonObject(object["statusText"]),
	            throttleRate: object["throttleRate"],
	            uid: object["uid"],
	            updatedAt: new Date(object["updatedAt"]),
	            url: object["url"],
	            version: object["version"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            channels: self.channels,
	            createdAt: self.createdAt,
	            description: self.description,
	            disabled: self.disabled,
	            filterTypes: self.filterTypes,
	            id: self.id,
	            nextAttempt: self.nextAttempt,
	            rateLimit: self.rateLimit,
	            status: messageStatus_1.MessageStatusSerializer._toJsonObject(self.status),
	            statusText: messageStatusText_1.MessageStatusTextSerializer._toJsonObject(self.statusText),
	            throttleRate: self.throttleRate,
	            uid: self.uid,
	            updatedAt: self.updatedAt,
	            url: self.url,
	            version: self.version,
	        };
	    },
	};
	
	return messageEndpointOut;
}

var hasRequiredListResponseMessageEndpointOut;

function requireListResponseMessageEndpointOut () {
	if (hasRequiredListResponseMessageEndpointOut) return listResponseMessageEndpointOut;
	hasRequiredListResponseMessageEndpointOut = 1;
	Object.defineProperty(listResponseMessageEndpointOut, "__esModule", { value: true });
	listResponseMessageEndpointOut.ListResponseMessageEndpointOutSerializer = void 0;
	const messageEndpointOut_1 = requireMessageEndpointOut();
	listResponseMessageEndpointOut.ListResponseMessageEndpointOutSerializer = {
	    _fromJsonObject(object) {
	        return {
	            data: object["data"].map((item) => messageEndpointOut_1.MessageEndpointOutSerializer._fromJsonObject(item)),
	            done: object["done"],
	            iterator: object["iterator"],
	            prevIterator: object["prevIterator"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            data: self.data.map((item) => messageEndpointOut_1.MessageEndpointOutSerializer._toJsonObject(item)),
	            done: self.done,
	            iterator: self.iterator,
	            prevIterator: self.prevIterator,
	        };
	    },
	};
	
	return listResponseMessageEndpointOut;
}

var hasRequiredMessageAttempt;

function requireMessageAttempt () {
	if (hasRequiredMessageAttempt) return messageAttempt;
	hasRequiredMessageAttempt = 1;
	Object.defineProperty(messageAttempt, "__esModule", { value: true });
	messageAttempt.MessageAttempt = void 0;
	const emptyResponse_1 = requireEmptyResponse();
	const listResponseEndpointMessageOut_1 = requireListResponseEndpointMessageOut();
	const listResponseMessageAttemptOut_1 = requireListResponseMessageAttemptOut();
	const listResponseMessageEndpointOut_1 = requireListResponseMessageEndpointOut();
	const messageAttemptOut_1 = requireMessageAttemptOut();
	const request_1 = requireRequest();
	class MessageAttempt {
	    constructor(requestCtx) {
	        this.requestCtx = requestCtx;
	    }
	    listByEndpoint(appId, endpointId, options) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/app/{app_id}/attempt/endpoint/{endpoint_id}");
	        request.setPathParam("app_id", appId);
	        request.setPathParam("endpoint_id", endpointId);
	        request.setQueryParams({
	            limit: options === null || options === void 0 ? void 0 : options.limit,
	            iterator: options === null || options === void 0 ? void 0 : options.iterator,
	            status: options === null || options === void 0 ? void 0 : options.status,
	            status_code_class: options === null || options === void 0 ? void 0 : options.statusCodeClass,
	            channel: options === null || options === void 0 ? void 0 : options.channel,
	            tag: options === null || options === void 0 ? void 0 : options.tag,
	            before: options === null || options === void 0 ? void 0 : options.before,
	            after: options === null || options === void 0 ? void 0 : options.after,
	            with_content: options === null || options === void 0 ? void 0 : options.withContent,
	            with_msg: options === null || options === void 0 ? void 0 : options.withMsg,
	            event_types: options === null || options === void 0 ? void 0 : options.eventTypes,
	        });
	        return request.send(this.requestCtx, listResponseMessageAttemptOut_1.ListResponseMessageAttemptOutSerializer._fromJsonObject);
	    }
	    listByMsg(appId, msgId, options) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/app/{app_id}/attempt/msg/{msg_id}");
	        request.setPathParam("app_id", appId);
	        request.setPathParam("msg_id", msgId);
	        request.setQueryParams({
	            limit: options === null || options === void 0 ? void 0 : options.limit,
	            iterator: options === null || options === void 0 ? void 0 : options.iterator,
	            status: options === null || options === void 0 ? void 0 : options.status,
	            status_code_class: options === null || options === void 0 ? void 0 : options.statusCodeClass,
	            channel: options === null || options === void 0 ? void 0 : options.channel,
	            tag: options === null || options === void 0 ? void 0 : options.tag,
	            endpoint_id: options === null || options === void 0 ? void 0 : options.endpointId,
	            before: options === null || options === void 0 ? void 0 : options.before,
	            after: options === null || options === void 0 ? void 0 : options.after,
	            with_content: options === null || options === void 0 ? void 0 : options.withContent,
	            event_types: options === null || options === void 0 ? void 0 : options.eventTypes,
	        });
	        return request.send(this.requestCtx, listResponseMessageAttemptOut_1.ListResponseMessageAttemptOutSerializer._fromJsonObject);
	    }
	    listAttemptedMessages(appId, endpointId, options) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/app/{app_id}/endpoint/{endpoint_id}/msg");
	        request.setPathParam("app_id", appId);
	        request.setPathParam("endpoint_id", endpointId);
	        request.setQueryParams({
	            limit: options === null || options === void 0 ? void 0 : options.limit,
	            iterator: options === null || options === void 0 ? void 0 : options.iterator,
	            channel: options === null || options === void 0 ? void 0 : options.channel,
	            tag: options === null || options === void 0 ? void 0 : options.tag,
	            status: options === null || options === void 0 ? void 0 : options.status,
	            before: options === null || options === void 0 ? void 0 : options.before,
	            after: options === null || options === void 0 ? void 0 : options.after,
	            with_content: options === null || options === void 0 ? void 0 : options.withContent,
	            event_types: options === null || options === void 0 ? void 0 : options.eventTypes,
	        });
	        return request.send(this.requestCtx, listResponseEndpointMessageOut_1.ListResponseEndpointMessageOutSerializer._fromJsonObject);
	    }
	    get(appId, msgId, attemptId) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/app/{app_id}/msg/{msg_id}/attempt/{attempt_id}");
	        request.setPathParam("app_id", appId);
	        request.setPathParam("msg_id", msgId);
	        request.setPathParam("attempt_id", attemptId);
	        return request.send(this.requestCtx, messageAttemptOut_1.MessageAttemptOutSerializer._fromJsonObject);
	    }
	    expungeContent(appId, msgId, attemptId) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.DELETE, "/api/v1/app/{app_id}/msg/{msg_id}/attempt/{attempt_id}/content");
	        request.setPathParam("app_id", appId);
	        request.setPathParam("msg_id", msgId);
	        request.setPathParam("attempt_id", attemptId);
	        return request.sendNoResponseBody(this.requestCtx);
	    }
	    listAttemptedDestinations(appId, msgId, options) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/app/{app_id}/msg/{msg_id}/endpoint");
	        request.setPathParam("app_id", appId);
	        request.setPathParam("msg_id", msgId);
	        request.setQueryParams({
	            limit: options === null || options === void 0 ? void 0 : options.limit,
	            iterator: options === null || options === void 0 ? void 0 : options.iterator,
	        });
	        return request.send(this.requestCtx, listResponseMessageEndpointOut_1.ListResponseMessageEndpointOutSerializer._fromJsonObject);
	    }
	    resend(appId, msgId, endpointId, options) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/app/{app_id}/msg/{msg_id}/endpoint/{endpoint_id}/resend");
	        request.setPathParam("app_id", appId);
	        request.setPathParam("msg_id", msgId);
	        request.setPathParam("endpoint_id", endpointId);
	        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
	        return request.send(this.requestCtx, emptyResponse_1.EmptyResponseSerializer._fromJsonObject);
	    }
	}
	messageAttempt.MessageAttempt = MessageAttempt;
	
	return messageAttempt;
}

var operationalWebhook = {};

var operationalWebhookEndpoint = {};

var listResponseOperationalWebhookEndpointOut = {};

var operationalWebhookEndpointOut = {};

var hasRequiredOperationalWebhookEndpointOut;

function requireOperationalWebhookEndpointOut () {
	if (hasRequiredOperationalWebhookEndpointOut) return operationalWebhookEndpointOut;
	hasRequiredOperationalWebhookEndpointOut = 1;
	Object.defineProperty(operationalWebhookEndpointOut, "__esModule", { value: true });
	operationalWebhookEndpointOut.OperationalWebhookEndpointOutSerializer = void 0;
	operationalWebhookEndpointOut.OperationalWebhookEndpointOutSerializer = {
	    _fromJsonObject(object) {
	        return {
	            createdAt: new Date(object["createdAt"]),
	            description: object["description"],
	            disabled: object["disabled"],
	            filterTypes: object["filterTypes"],
	            id: object["id"],
	            metadata: object["metadata"],
	            rateLimit: object["rateLimit"],
	            uid: object["uid"],
	            updatedAt: new Date(object["updatedAt"]),
	            url: object["url"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            createdAt: self.createdAt,
	            description: self.description,
	            disabled: self.disabled,
	            filterTypes: self.filterTypes,
	            id: self.id,
	            metadata: self.metadata,
	            rateLimit: self.rateLimit,
	            uid: self.uid,
	            updatedAt: self.updatedAt,
	            url: self.url,
	        };
	    },
	};
	
	return operationalWebhookEndpointOut;
}

var hasRequiredListResponseOperationalWebhookEndpointOut;

function requireListResponseOperationalWebhookEndpointOut () {
	if (hasRequiredListResponseOperationalWebhookEndpointOut) return listResponseOperationalWebhookEndpointOut;
	hasRequiredListResponseOperationalWebhookEndpointOut = 1;
	Object.defineProperty(listResponseOperationalWebhookEndpointOut, "__esModule", { value: true });
	listResponseOperationalWebhookEndpointOut.ListResponseOperationalWebhookEndpointOutSerializer = void 0;
	const operationalWebhookEndpointOut_1 = requireOperationalWebhookEndpointOut();
	listResponseOperationalWebhookEndpointOut.ListResponseOperationalWebhookEndpointOutSerializer = {
	    _fromJsonObject(object) {
	        return {
	            data: object["data"].map((item) => operationalWebhookEndpointOut_1.OperationalWebhookEndpointOutSerializer._fromJsonObject(item)),
	            done: object["done"],
	            iterator: object["iterator"],
	            prevIterator: object["prevIterator"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            data: self.data.map((item) => operationalWebhookEndpointOut_1.OperationalWebhookEndpointOutSerializer._toJsonObject(item)),
	            done: self.done,
	            iterator: self.iterator,
	            prevIterator: self.prevIterator,
	        };
	    },
	};
	
	return listResponseOperationalWebhookEndpointOut;
}

var operationalWebhookEndpointHeadersIn = {};

var hasRequiredOperationalWebhookEndpointHeadersIn;

function requireOperationalWebhookEndpointHeadersIn () {
	if (hasRequiredOperationalWebhookEndpointHeadersIn) return operationalWebhookEndpointHeadersIn;
	hasRequiredOperationalWebhookEndpointHeadersIn = 1;
	Object.defineProperty(operationalWebhookEndpointHeadersIn, "__esModule", { value: true });
	operationalWebhookEndpointHeadersIn.OperationalWebhookEndpointHeadersInSerializer = void 0;
	operationalWebhookEndpointHeadersIn.OperationalWebhookEndpointHeadersInSerializer = {
	    _fromJsonObject(object) {
	        return {
	            headers: object["headers"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            headers: self.headers,
	        };
	    },
	};
	
	return operationalWebhookEndpointHeadersIn;
}

var operationalWebhookEndpointHeadersOut = {};

var hasRequiredOperationalWebhookEndpointHeadersOut;

function requireOperationalWebhookEndpointHeadersOut () {
	if (hasRequiredOperationalWebhookEndpointHeadersOut) return operationalWebhookEndpointHeadersOut;
	hasRequiredOperationalWebhookEndpointHeadersOut = 1;
	Object.defineProperty(operationalWebhookEndpointHeadersOut, "__esModule", { value: true });
	operationalWebhookEndpointHeadersOut.OperationalWebhookEndpointHeadersOutSerializer = void 0;
	operationalWebhookEndpointHeadersOut.OperationalWebhookEndpointHeadersOutSerializer = {
	    _fromJsonObject(object) {
	        return {
	            headers: object["headers"],
	            sensitive: object["sensitive"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            headers: self.headers,
	            sensitive: self.sensitive,
	        };
	    },
	};
	
	return operationalWebhookEndpointHeadersOut;
}

var operationalWebhookEndpointIn = {};

var hasRequiredOperationalWebhookEndpointIn;

function requireOperationalWebhookEndpointIn () {
	if (hasRequiredOperationalWebhookEndpointIn) return operationalWebhookEndpointIn;
	hasRequiredOperationalWebhookEndpointIn = 1;
	Object.defineProperty(operationalWebhookEndpointIn, "__esModule", { value: true });
	operationalWebhookEndpointIn.OperationalWebhookEndpointInSerializer = void 0;
	operationalWebhookEndpointIn.OperationalWebhookEndpointInSerializer = {
	    _fromJsonObject(object) {
	        return {
	            description: object["description"],
	            disabled: object["disabled"],
	            filterTypes: object["filterTypes"],
	            metadata: object["metadata"],
	            rateLimit: object["rateLimit"],
	            secret: object["secret"],
	            uid: object["uid"],
	            url: object["url"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            description: self.description,
	            disabled: self.disabled,
	            filterTypes: self.filterTypes,
	            metadata: self.metadata,
	            rateLimit: self.rateLimit,
	            secret: self.secret,
	            uid: self.uid,
	            url: self.url,
	        };
	    },
	};
	
	return operationalWebhookEndpointIn;
}

var operationalWebhookEndpointSecretIn = {};

var hasRequiredOperationalWebhookEndpointSecretIn;

function requireOperationalWebhookEndpointSecretIn () {
	if (hasRequiredOperationalWebhookEndpointSecretIn) return operationalWebhookEndpointSecretIn;
	hasRequiredOperationalWebhookEndpointSecretIn = 1;
	Object.defineProperty(operationalWebhookEndpointSecretIn, "__esModule", { value: true });
	operationalWebhookEndpointSecretIn.OperationalWebhookEndpointSecretInSerializer = void 0;
	operationalWebhookEndpointSecretIn.OperationalWebhookEndpointSecretInSerializer = {
	    _fromJsonObject(object) {
	        return {
	            key: object["key"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            key: self.key,
	        };
	    },
	};
	
	return operationalWebhookEndpointSecretIn;
}

var operationalWebhookEndpointSecretOut = {};

var hasRequiredOperationalWebhookEndpointSecretOut;

function requireOperationalWebhookEndpointSecretOut () {
	if (hasRequiredOperationalWebhookEndpointSecretOut) return operationalWebhookEndpointSecretOut;
	hasRequiredOperationalWebhookEndpointSecretOut = 1;
	Object.defineProperty(operationalWebhookEndpointSecretOut, "__esModule", { value: true });
	operationalWebhookEndpointSecretOut.OperationalWebhookEndpointSecretOutSerializer = void 0;
	operationalWebhookEndpointSecretOut.OperationalWebhookEndpointSecretOutSerializer = {
	    _fromJsonObject(object) {
	        return {
	            key: object["key"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            key: self.key,
	        };
	    },
	};
	
	return operationalWebhookEndpointSecretOut;
}

var operationalWebhookEndpointUpdate = {};

var hasRequiredOperationalWebhookEndpointUpdate;

function requireOperationalWebhookEndpointUpdate () {
	if (hasRequiredOperationalWebhookEndpointUpdate) return operationalWebhookEndpointUpdate;
	hasRequiredOperationalWebhookEndpointUpdate = 1;
	Object.defineProperty(operationalWebhookEndpointUpdate, "__esModule", { value: true });
	operationalWebhookEndpointUpdate.OperationalWebhookEndpointUpdateSerializer = void 0;
	operationalWebhookEndpointUpdate.OperationalWebhookEndpointUpdateSerializer = {
	    _fromJsonObject(object) {
	        return {
	            description: object["description"],
	            disabled: object["disabled"],
	            filterTypes: object["filterTypes"],
	            metadata: object["metadata"],
	            rateLimit: object["rateLimit"],
	            uid: object["uid"],
	            url: object["url"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            description: self.description,
	            disabled: self.disabled,
	            filterTypes: self.filterTypes,
	            metadata: self.metadata,
	            rateLimit: self.rateLimit,
	            uid: self.uid,
	            url: self.url,
	        };
	    },
	};
	
	return operationalWebhookEndpointUpdate;
}

var hasRequiredOperationalWebhookEndpoint;

function requireOperationalWebhookEndpoint () {
	if (hasRequiredOperationalWebhookEndpoint) return operationalWebhookEndpoint;
	hasRequiredOperationalWebhookEndpoint = 1;
	Object.defineProperty(operationalWebhookEndpoint, "__esModule", { value: true });
	operationalWebhookEndpoint.OperationalWebhookEndpoint = void 0;
	const listResponseOperationalWebhookEndpointOut_1 = requireListResponseOperationalWebhookEndpointOut();
	const operationalWebhookEndpointHeadersIn_1 = requireOperationalWebhookEndpointHeadersIn();
	const operationalWebhookEndpointHeadersOut_1 = requireOperationalWebhookEndpointHeadersOut();
	const operationalWebhookEndpointIn_1 = requireOperationalWebhookEndpointIn();
	const operationalWebhookEndpointOut_1 = requireOperationalWebhookEndpointOut();
	const operationalWebhookEndpointSecretIn_1 = requireOperationalWebhookEndpointSecretIn();
	const operationalWebhookEndpointSecretOut_1 = requireOperationalWebhookEndpointSecretOut();
	const operationalWebhookEndpointUpdate_1 = requireOperationalWebhookEndpointUpdate();
	const request_1 = requireRequest();
	class OperationalWebhookEndpoint {
	    constructor(requestCtx) {
	        this.requestCtx = requestCtx;
	    }
	    list(options) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/operational-webhook/endpoint");
	        request.setQueryParams({
	            limit: options === null || options === void 0 ? void 0 : options.limit,
	            iterator: options === null || options === void 0 ? void 0 : options.iterator,
	            order: options === null || options === void 0 ? void 0 : options.order,
	        });
	        return request.send(this.requestCtx, listResponseOperationalWebhookEndpointOut_1.ListResponseOperationalWebhookEndpointOutSerializer._fromJsonObject);
	    }
	    create(operationalWebhookEndpointIn, options) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/operational-webhook/endpoint");
	        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
	        request.setBody(operationalWebhookEndpointIn_1.OperationalWebhookEndpointInSerializer._toJsonObject(operationalWebhookEndpointIn));
	        return request.send(this.requestCtx, operationalWebhookEndpointOut_1.OperationalWebhookEndpointOutSerializer._fromJsonObject);
	    }
	    get(endpointId) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/operational-webhook/endpoint/{endpoint_id}");
	        request.setPathParam("endpoint_id", endpointId);
	        return request.send(this.requestCtx, operationalWebhookEndpointOut_1.OperationalWebhookEndpointOutSerializer._fromJsonObject);
	    }
	    update(endpointId, operationalWebhookEndpointUpdate) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.PUT, "/api/v1/operational-webhook/endpoint/{endpoint_id}");
	        request.setPathParam("endpoint_id", endpointId);
	        request.setBody(operationalWebhookEndpointUpdate_1.OperationalWebhookEndpointUpdateSerializer._toJsonObject(operationalWebhookEndpointUpdate));
	        return request.send(this.requestCtx, operationalWebhookEndpointOut_1.OperationalWebhookEndpointOutSerializer._fromJsonObject);
	    }
	    delete(endpointId) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.DELETE, "/api/v1/operational-webhook/endpoint/{endpoint_id}");
	        request.setPathParam("endpoint_id", endpointId);
	        return request.sendNoResponseBody(this.requestCtx);
	    }
	    getHeaders(endpointId) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/operational-webhook/endpoint/{endpoint_id}/headers");
	        request.setPathParam("endpoint_id", endpointId);
	        return request.send(this.requestCtx, operationalWebhookEndpointHeadersOut_1.OperationalWebhookEndpointHeadersOutSerializer._fromJsonObject);
	    }
	    updateHeaders(endpointId, operationalWebhookEndpointHeadersIn) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.PUT, "/api/v1/operational-webhook/endpoint/{endpoint_id}/headers");
	        request.setPathParam("endpoint_id", endpointId);
	        request.setBody(operationalWebhookEndpointHeadersIn_1.OperationalWebhookEndpointHeadersInSerializer._toJsonObject(operationalWebhookEndpointHeadersIn));
	        return request.sendNoResponseBody(this.requestCtx);
	    }
	    getSecret(endpointId) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/operational-webhook/endpoint/{endpoint_id}/secret");
	        request.setPathParam("endpoint_id", endpointId);
	        return request.send(this.requestCtx, operationalWebhookEndpointSecretOut_1.OperationalWebhookEndpointSecretOutSerializer._fromJsonObject);
	    }
	    rotateSecret(endpointId, operationalWebhookEndpointSecretIn, options) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/operational-webhook/endpoint/{endpoint_id}/secret/rotate");
	        request.setPathParam("endpoint_id", endpointId);
	        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
	        request.setBody(operationalWebhookEndpointSecretIn_1.OperationalWebhookEndpointSecretInSerializer._toJsonObject(operationalWebhookEndpointSecretIn));
	        return request.sendNoResponseBody(this.requestCtx);
	    }
	}
	operationalWebhookEndpoint.OperationalWebhookEndpoint = OperationalWebhookEndpoint;
	
	return operationalWebhookEndpoint;
}

var hasRequiredOperationalWebhook;

function requireOperationalWebhook () {
	if (hasRequiredOperationalWebhook) return operationalWebhook;
	hasRequiredOperationalWebhook = 1;
	Object.defineProperty(operationalWebhook, "__esModule", { value: true });
	operationalWebhook.OperationalWebhook = void 0;
	const operationalWebhookEndpoint_1 = requireOperationalWebhookEndpoint();
	class OperationalWebhook {
	    constructor(requestCtx) {
	        this.requestCtx = requestCtx;
	    }
	    get endpoint() {
	        return new operationalWebhookEndpoint_1.OperationalWebhookEndpoint(this.requestCtx);
	    }
	}
	operationalWebhook.OperationalWebhook = OperationalWebhook;
	
	return operationalWebhook;
}

var statistics = {};

var aggregateEventTypesOut = {};

var hasRequiredAggregateEventTypesOut;

function requireAggregateEventTypesOut () {
	if (hasRequiredAggregateEventTypesOut) return aggregateEventTypesOut;
	hasRequiredAggregateEventTypesOut = 1;
	Object.defineProperty(aggregateEventTypesOut, "__esModule", { value: true });
	aggregateEventTypesOut.AggregateEventTypesOutSerializer = void 0;
	const backgroundTaskStatus_1 = requireBackgroundTaskStatus();
	const backgroundTaskType_1 = requireBackgroundTaskType();
	aggregateEventTypesOut.AggregateEventTypesOutSerializer = {
	    _fromJsonObject(object) {
	        return {
	            id: object["id"],
	            status: backgroundTaskStatus_1.BackgroundTaskStatusSerializer._fromJsonObject(object["status"]),
	            task: backgroundTaskType_1.BackgroundTaskTypeSerializer._fromJsonObject(object["task"]),
	            updatedAt: new Date(object["updatedAt"]),
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            id: self.id,
	            status: backgroundTaskStatus_1.BackgroundTaskStatusSerializer._toJsonObject(self.status),
	            task: backgroundTaskType_1.BackgroundTaskTypeSerializer._toJsonObject(self.task),
	            updatedAt: self.updatedAt,
	        };
	    },
	};
	
	return aggregateEventTypesOut;
}

var appUsageStatsIn = {};

var hasRequiredAppUsageStatsIn;

function requireAppUsageStatsIn () {
	if (hasRequiredAppUsageStatsIn) return appUsageStatsIn;
	hasRequiredAppUsageStatsIn = 1;
	Object.defineProperty(appUsageStatsIn, "__esModule", { value: true });
	appUsageStatsIn.AppUsageStatsInSerializer = void 0;
	appUsageStatsIn.AppUsageStatsInSerializer = {
	    _fromJsonObject(object) {
	        return {
	            appIds: object["appIds"],
	            since: new Date(object["since"]),
	            until: new Date(object["until"]),
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            appIds: self.appIds,
	            since: self.since,
	            until: self.until,
	        };
	    },
	};
	
	return appUsageStatsIn;
}

var appUsageStatsOut = {};

var hasRequiredAppUsageStatsOut;

function requireAppUsageStatsOut () {
	if (hasRequiredAppUsageStatsOut) return appUsageStatsOut;
	hasRequiredAppUsageStatsOut = 1;
	Object.defineProperty(appUsageStatsOut, "__esModule", { value: true });
	appUsageStatsOut.AppUsageStatsOutSerializer = void 0;
	const backgroundTaskStatus_1 = requireBackgroundTaskStatus();
	const backgroundTaskType_1 = requireBackgroundTaskType();
	appUsageStatsOut.AppUsageStatsOutSerializer = {
	    _fromJsonObject(object) {
	        return {
	            id: object["id"],
	            status: backgroundTaskStatus_1.BackgroundTaskStatusSerializer._fromJsonObject(object["status"]),
	            task: backgroundTaskType_1.BackgroundTaskTypeSerializer._fromJsonObject(object["task"]),
	            unresolvedAppIds: object["unresolvedAppIds"],
	            updatedAt: new Date(object["updatedAt"]),
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            id: self.id,
	            status: backgroundTaskStatus_1.BackgroundTaskStatusSerializer._toJsonObject(self.status),
	            task: backgroundTaskType_1.BackgroundTaskTypeSerializer._toJsonObject(self.task),
	            unresolvedAppIds: self.unresolvedAppIds,
	            updatedAt: self.updatedAt,
	        };
	    },
	};
	
	return appUsageStatsOut;
}

var hasRequiredStatistics;

function requireStatistics () {
	if (hasRequiredStatistics) return statistics;
	hasRequiredStatistics = 1;
	Object.defineProperty(statistics, "__esModule", { value: true });
	statistics.Statistics = void 0;
	const aggregateEventTypesOut_1 = requireAggregateEventTypesOut();
	const appUsageStatsIn_1 = requireAppUsageStatsIn();
	const appUsageStatsOut_1 = requireAppUsageStatsOut();
	const request_1 = requireRequest();
	class Statistics {
	    constructor(requestCtx) {
	        this.requestCtx = requestCtx;
	    }
	    aggregateAppStats(appUsageStatsIn, options) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/stats/usage/app");
	        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
	        request.setBody(appUsageStatsIn_1.AppUsageStatsInSerializer._toJsonObject(appUsageStatsIn));
	        return request.send(this.requestCtx, appUsageStatsOut_1.AppUsageStatsOutSerializer._fromJsonObject);
	    }
	    aggregateEventTypes() {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.PUT, "/api/v1/stats/usage/event-types");
	        return request.send(this.requestCtx, aggregateEventTypesOut_1.AggregateEventTypesOutSerializer._fromJsonObject);
	    }
	}
	statistics.Statistics = Statistics;
	
	return statistics;
}

var streaming = {};

var httpSinkHeadersPatchIn = {};

var hasRequiredHttpSinkHeadersPatchIn;

function requireHttpSinkHeadersPatchIn () {
	if (hasRequiredHttpSinkHeadersPatchIn) return httpSinkHeadersPatchIn;
	hasRequiredHttpSinkHeadersPatchIn = 1;
	Object.defineProperty(httpSinkHeadersPatchIn, "__esModule", { value: true });
	httpSinkHeadersPatchIn.HttpSinkHeadersPatchInSerializer = void 0;
	httpSinkHeadersPatchIn.HttpSinkHeadersPatchInSerializer = {
	    _fromJsonObject(object) {
	        return {
	            headers: object["headers"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            headers: self.headers,
	        };
	    },
	};
	
	return httpSinkHeadersPatchIn;
}

var sinkTransformationOut = {};

var hasRequiredSinkTransformationOut;

function requireSinkTransformationOut () {
	if (hasRequiredSinkTransformationOut) return sinkTransformationOut;
	hasRequiredSinkTransformationOut = 1;
	Object.defineProperty(sinkTransformationOut, "__esModule", { value: true });
	sinkTransformationOut.SinkTransformationOutSerializer = void 0;
	sinkTransformationOut.SinkTransformationOutSerializer = {
	    _fromJsonObject(object) {
	        return {
	            code: object["code"],
	            enabled: object["enabled"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            code: self.code,
	            enabled: self.enabled,
	        };
	    },
	};
	
	return sinkTransformationOut;
}

var streamingEventType = {};

var listResponseStreamEventTypeOut = {};

var streamEventTypeOut = {};

var hasRequiredStreamEventTypeOut;

function requireStreamEventTypeOut () {
	if (hasRequiredStreamEventTypeOut) return streamEventTypeOut;
	hasRequiredStreamEventTypeOut = 1;
	Object.defineProperty(streamEventTypeOut, "__esModule", { value: true });
	streamEventTypeOut.StreamEventTypeOutSerializer = void 0;
	streamEventTypeOut.StreamEventTypeOutSerializer = {
	    _fromJsonObject(object) {
	        return {
	            archived: object["archived"],
	            createdAt: new Date(object["createdAt"]),
	            deprecated: object["deprecated"],
	            description: object["description"],
	            featureFlags: object["featureFlags"],
	            name: object["name"],
	            updatedAt: new Date(object["updatedAt"]),
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            archived: self.archived,
	            createdAt: self.createdAt,
	            deprecated: self.deprecated,
	            description: self.description,
	            featureFlags: self.featureFlags,
	            name: self.name,
	            updatedAt: self.updatedAt,
	        };
	    },
	};
	
	return streamEventTypeOut;
}

var hasRequiredListResponseStreamEventTypeOut;

function requireListResponseStreamEventTypeOut () {
	if (hasRequiredListResponseStreamEventTypeOut) return listResponseStreamEventTypeOut;
	hasRequiredListResponseStreamEventTypeOut = 1;
	Object.defineProperty(listResponseStreamEventTypeOut, "__esModule", { value: true });
	listResponseStreamEventTypeOut.ListResponseStreamEventTypeOutSerializer = void 0;
	const streamEventTypeOut_1 = requireStreamEventTypeOut();
	listResponseStreamEventTypeOut.ListResponseStreamEventTypeOutSerializer = {
	    _fromJsonObject(object) {
	        return {
	            data: object["data"].map((item) => streamEventTypeOut_1.StreamEventTypeOutSerializer._fromJsonObject(item)),
	            done: object["done"],
	            iterator: object["iterator"],
	            prevIterator: object["prevIterator"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            data: self.data.map((item) => streamEventTypeOut_1.StreamEventTypeOutSerializer._toJsonObject(item)),
	            done: self.done,
	            iterator: self.iterator,
	            prevIterator: self.prevIterator,
	        };
	    },
	};
	
	return listResponseStreamEventTypeOut;
}

var streamEventTypeIn = {};

var hasRequiredStreamEventTypeIn;

function requireStreamEventTypeIn () {
	if (hasRequiredStreamEventTypeIn) return streamEventTypeIn;
	hasRequiredStreamEventTypeIn = 1;
	Object.defineProperty(streamEventTypeIn, "__esModule", { value: true });
	streamEventTypeIn.StreamEventTypeInSerializer = void 0;
	streamEventTypeIn.StreamEventTypeInSerializer = {
	    _fromJsonObject(object) {
	        return {
	            archived: object["archived"],
	            deprecated: object["deprecated"],
	            description: object["description"],
	            featureFlags: object["featureFlags"],
	            name: object["name"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            archived: self.archived,
	            deprecated: self.deprecated,
	            description: self.description,
	            featureFlags: self.featureFlags,
	            name: self.name,
	        };
	    },
	};
	
	return streamEventTypeIn;
}

var streamEventTypePatch = {};

var hasRequiredStreamEventTypePatch;

function requireStreamEventTypePatch () {
	if (hasRequiredStreamEventTypePatch) return streamEventTypePatch;
	hasRequiredStreamEventTypePatch = 1;
	Object.defineProperty(streamEventTypePatch, "__esModule", { value: true });
	streamEventTypePatch.StreamEventTypePatchSerializer = void 0;
	streamEventTypePatch.StreamEventTypePatchSerializer = {
	    _fromJsonObject(object) {
	        return {
	            archived: object["archived"],
	            deprecated: object["deprecated"],
	            description: object["description"],
	            featureFlags: object["featureFlags"],
	            name: object["name"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            archived: self.archived,
	            deprecated: self.deprecated,
	            description: self.description,
	            featureFlags: self.featureFlags,
	            name: self.name,
	        };
	    },
	};
	
	return streamEventTypePatch;
}

var hasRequiredStreamingEventType;

function requireStreamingEventType () {
	if (hasRequiredStreamingEventType) return streamingEventType;
	hasRequiredStreamingEventType = 1;
	Object.defineProperty(streamingEventType, "__esModule", { value: true });
	streamingEventType.StreamingEventType = void 0;
	const listResponseStreamEventTypeOut_1 = requireListResponseStreamEventTypeOut();
	const streamEventTypeIn_1 = requireStreamEventTypeIn();
	const streamEventTypeOut_1 = requireStreamEventTypeOut();
	const streamEventTypePatch_1 = requireStreamEventTypePatch();
	const request_1 = requireRequest();
	class StreamingEventType {
	    constructor(requestCtx) {
	        this.requestCtx = requestCtx;
	    }
	    list(options) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/stream/event-type");
	        request.setQueryParams({
	            limit: options === null || options === void 0 ? void 0 : options.limit,
	            iterator: options === null || options === void 0 ? void 0 : options.iterator,
	            order: options === null || options === void 0 ? void 0 : options.order,
	            include_archived: options === null || options === void 0 ? void 0 : options.includeArchived,
	        });
	        return request.send(this.requestCtx, listResponseStreamEventTypeOut_1.ListResponseStreamEventTypeOutSerializer._fromJsonObject);
	    }
	    create(streamEventTypeIn, options) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/stream/event-type");
	        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
	        request.setBody(streamEventTypeIn_1.StreamEventTypeInSerializer._toJsonObject(streamEventTypeIn));
	        return request.send(this.requestCtx, streamEventTypeOut_1.StreamEventTypeOutSerializer._fromJsonObject);
	    }
	    get(name) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/stream/event-type/{name}");
	        request.setPathParam("name", name);
	        return request.send(this.requestCtx, streamEventTypeOut_1.StreamEventTypeOutSerializer._fromJsonObject);
	    }
	    update(name, streamEventTypeIn) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.PUT, "/api/v1/stream/event-type/{name}");
	        request.setPathParam("name", name);
	        request.setBody(streamEventTypeIn_1.StreamEventTypeInSerializer._toJsonObject(streamEventTypeIn));
	        return request.send(this.requestCtx, streamEventTypeOut_1.StreamEventTypeOutSerializer._fromJsonObject);
	    }
	    delete(name, options) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.DELETE, "/api/v1/stream/event-type/{name}");
	        request.setPathParam("name", name);
	        request.setQueryParams({
	            expunge: options === null || options === void 0 ? void 0 : options.expunge,
	        });
	        return request.sendNoResponseBody(this.requestCtx);
	    }
	    patch(name, streamEventTypePatch) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.PATCH, "/api/v1/stream/event-type/{name}");
	        request.setPathParam("name", name);
	        request.setBody(streamEventTypePatch_1.StreamEventTypePatchSerializer._toJsonObject(streamEventTypePatch));
	        return request.send(this.requestCtx, streamEventTypeOut_1.StreamEventTypeOutSerializer._fromJsonObject);
	    }
	}
	streamingEventType.StreamingEventType = StreamingEventType;
	
	return streamingEventType;
}

var streamingEvents = {};

var createStreamEventsIn = {};

var eventIn = {};

var hasRequiredEventIn;

function requireEventIn () {
	if (hasRequiredEventIn) return eventIn;
	hasRequiredEventIn = 1;
	Object.defineProperty(eventIn, "__esModule", { value: true });
	eventIn.EventInSerializer = void 0;
	eventIn.EventInSerializer = {
	    _fromJsonObject(object) {
	        return {
	            eventType: object["eventType"],
	            payload: object["payload"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            eventType: self.eventType,
	            payload: self.payload,
	        };
	    },
	};
	
	return eventIn;
}

var streamIn = {};

var hasRequiredStreamIn;

function requireStreamIn () {
	if (hasRequiredStreamIn) return streamIn;
	hasRequiredStreamIn = 1;
	Object.defineProperty(streamIn, "__esModule", { value: true });
	streamIn.StreamInSerializer = void 0;
	streamIn.StreamInSerializer = {
	    _fromJsonObject(object) {
	        return {
	            metadata: object["metadata"],
	            name: object["name"],
	            uid: object["uid"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            metadata: self.metadata,
	            name: self.name,
	            uid: self.uid,
	        };
	    },
	};
	
	return streamIn;
}

var hasRequiredCreateStreamEventsIn;

function requireCreateStreamEventsIn () {
	if (hasRequiredCreateStreamEventsIn) return createStreamEventsIn;
	hasRequiredCreateStreamEventsIn = 1;
	Object.defineProperty(createStreamEventsIn, "__esModule", { value: true });
	createStreamEventsIn.CreateStreamEventsInSerializer = void 0;
	const eventIn_1 = requireEventIn();
	const streamIn_1 = requireStreamIn();
	createStreamEventsIn.CreateStreamEventsInSerializer = {
	    _fromJsonObject(object) {
	        return {
	            events: object["events"].map((item) => eventIn_1.EventInSerializer._fromJsonObject(item)),
	            stream: object["stream"] != null
	                ? streamIn_1.StreamInSerializer._fromJsonObject(object["stream"])
	                : undefined,
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            events: self.events.map((item) => eventIn_1.EventInSerializer._toJsonObject(item)),
	            stream: self.stream != null ? streamIn_1.StreamInSerializer._toJsonObject(self.stream) : undefined,
	        };
	    },
	};
	
	return createStreamEventsIn;
}

var createStreamEventsOut = {};

var hasRequiredCreateStreamEventsOut;

function requireCreateStreamEventsOut () {
	if (hasRequiredCreateStreamEventsOut) return createStreamEventsOut;
	hasRequiredCreateStreamEventsOut = 1;
	Object.defineProperty(createStreamEventsOut, "__esModule", { value: true });
	createStreamEventsOut.CreateStreamEventsOutSerializer = void 0;
	createStreamEventsOut.CreateStreamEventsOutSerializer = {
	    _fromJsonObject(_object) {
	        return {};
	    },
	    _toJsonObject(_self) {
	        return {};
	    },
	};
	
	return createStreamEventsOut;
}

var eventStreamOut = {};

var eventOut = {};

var hasRequiredEventOut;

function requireEventOut () {
	if (hasRequiredEventOut) return eventOut;
	hasRequiredEventOut = 1;
	Object.defineProperty(eventOut, "__esModule", { value: true });
	eventOut.EventOutSerializer = void 0;
	eventOut.EventOutSerializer = {
	    _fromJsonObject(object) {
	        return {
	            eventType: object["eventType"],
	            payload: object["payload"],
	            timestamp: new Date(object["timestamp"]),
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            eventType: self.eventType,
	            payload: self.payload,
	            timestamp: self.timestamp,
	        };
	    },
	};
	
	return eventOut;
}

var hasRequiredEventStreamOut;

function requireEventStreamOut () {
	if (hasRequiredEventStreamOut) return eventStreamOut;
	hasRequiredEventStreamOut = 1;
	Object.defineProperty(eventStreamOut, "__esModule", { value: true });
	eventStreamOut.EventStreamOutSerializer = void 0;
	const eventOut_1 = requireEventOut();
	eventStreamOut.EventStreamOutSerializer = {
	    _fromJsonObject(object) {
	        return {
	            data: object["data"].map((item) => eventOut_1.EventOutSerializer._fromJsonObject(item)),
	            done: object["done"],
	            iterator: object["iterator"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            data: self.data.map((item) => eventOut_1.EventOutSerializer._toJsonObject(item)),
	            done: self.done,
	            iterator: self.iterator,
	        };
	    },
	};
	
	return eventStreamOut;
}

var hasRequiredStreamingEvents;

function requireStreamingEvents () {
	if (hasRequiredStreamingEvents) return streamingEvents;
	hasRequiredStreamingEvents = 1;
	Object.defineProperty(streamingEvents, "__esModule", { value: true });
	streamingEvents.StreamingEvents = void 0;
	const createStreamEventsIn_1 = requireCreateStreamEventsIn();
	const createStreamEventsOut_1 = requireCreateStreamEventsOut();
	const eventStreamOut_1 = requireEventStreamOut();
	const request_1 = requireRequest();
	class StreamingEvents {
	    constructor(requestCtx) {
	        this.requestCtx = requestCtx;
	    }
	    create(streamId, createStreamEventsIn, options) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/stream/{stream_id}/events");
	        request.setPathParam("stream_id", streamId);
	        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
	        request.setBody(createStreamEventsIn_1.CreateStreamEventsInSerializer._toJsonObject(createStreamEventsIn));
	        return request.send(this.requestCtx, createStreamEventsOut_1.CreateStreamEventsOutSerializer._fromJsonObject);
	    }
	    get(streamId, sinkId, options) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/stream/{stream_id}/sink/{sink_id}/events");
	        request.setPathParam("stream_id", streamId);
	        request.setPathParam("sink_id", sinkId);
	        request.setQueryParams({
	            limit: options === null || options === void 0 ? void 0 : options.limit,
	            iterator: options === null || options === void 0 ? void 0 : options.iterator,
	            after: options === null || options === void 0 ? void 0 : options.after,
	        });
	        return request.send(this.requestCtx, eventStreamOut_1.EventStreamOutSerializer._fromJsonObject);
	    }
	}
	streamingEvents.StreamingEvents = StreamingEvents;
	
	return streamingEvents;
}

var streamingSink = {};

var listResponseStreamSinkOut = {};

var streamSinkOut = {};

var azureBlobStorageConfig = {};

var hasRequiredAzureBlobStorageConfig;

function requireAzureBlobStorageConfig () {
	if (hasRequiredAzureBlobStorageConfig) return azureBlobStorageConfig;
	hasRequiredAzureBlobStorageConfig = 1;
	Object.defineProperty(azureBlobStorageConfig, "__esModule", { value: true });
	azureBlobStorageConfig.AzureBlobStorageConfigSerializer = void 0;
	azureBlobStorageConfig.AzureBlobStorageConfigSerializer = {
	    _fromJsonObject(object) {
	        return {
	            accessKey: object["accessKey"],
	            account: object["account"],
	            container: object["container"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            accessKey: self.accessKey,
	            account: self.account,
	            container: self.container,
	        };
	    },
	};
	
	return azureBlobStorageConfig;
}

var googleCloudStorageConfig = {};

var hasRequiredGoogleCloudStorageConfig;

function requireGoogleCloudStorageConfig () {
	if (hasRequiredGoogleCloudStorageConfig) return googleCloudStorageConfig;
	hasRequiredGoogleCloudStorageConfig = 1;
	Object.defineProperty(googleCloudStorageConfig, "__esModule", { value: true });
	googleCloudStorageConfig.GoogleCloudStorageConfigSerializer = void 0;
	googleCloudStorageConfig.GoogleCloudStorageConfigSerializer = {
	    _fromJsonObject(object) {
	        return {
	            bucket: object["bucket"],
	            credentials: object["credentials"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            bucket: self.bucket,
	            credentials: self.credentials,
	        };
	    },
	};
	
	return googleCloudStorageConfig;
}

var s3Config = {};

var hasRequiredS3Config;

function requireS3Config () {
	if (hasRequiredS3Config) return s3Config;
	hasRequiredS3Config = 1;
	Object.defineProperty(s3Config, "__esModule", { value: true });
	s3Config.S3ConfigSerializer = void 0;
	s3Config.S3ConfigSerializer = {
	    _fromJsonObject(object) {
	        return {
	            accessKeyId: object["accessKeyId"],
	            bucket: object["bucket"],
	            endpointUrl: object["endpointUrl"],
	            region: object["region"],
	            secretAccessKey: object["secretAccessKey"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            accessKeyId: self.accessKeyId,
	            bucket: self.bucket,
	            endpointUrl: self.endpointUrl,
	            region: self.region,
	            secretAccessKey: self.secretAccessKey,
	        };
	    },
	};
	
	return s3Config;
}

var sinkHttpConfig = {};

var hasRequiredSinkHttpConfig;

function requireSinkHttpConfig () {
	if (hasRequiredSinkHttpConfig) return sinkHttpConfig;
	hasRequiredSinkHttpConfig = 1;
	Object.defineProperty(sinkHttpConfig, "__esModule", { value: true });
	sinkHttpConfig.SinkHttpConfigSerializer = void 0;
	sinkHttpConfig.SinkHttpConfigSerializer = {
	    _fromJsonObject(object) {
	        return {
	            headers: object["headers"],
	            key: object["key"],
	            url: object["url"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            headers: self.headers,
	            key: self.key,
	            url: self.url,
	        };
	    },
	};
	
	return sinkHttpConfig;
}

var sinkOtelV1Config = {};

var hasRequiredSinkOtelV1Config;

function requireSinkOtelV1Config () {
	if (hasRequiredSinkOtelV1Config) return sinkOtelV1Config;
	hasRequiredSinkOtelV1Config = 1;
	Object.defineProperty(sinkOtelV1Config, "__esModule", { value: true });
	sinkOtelV1Config.SinkOtelV1ConfigSerializer = void 0;
	sinkOtelV1Config.SinkOtelV1ConfigSerializer = {
	    _fromJsonObject(object) {
	        return {
	            headers: object["headers"],
	            url: object["url"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            headers: self.headers,
	            url: self.url,
	        };
	    },
	};
	
	return sinkOtelV1Config;
}

var sinkStatus = {};

var hasRequiredSinkStatus;

function requireSinkStatus () {
	if (hasRequiredSinkStatus) return sinkStatus;
	hasRequiredSinkStatus = 1;
	(function (exports$1) {
		Object.defineProperty(exports$1, "__esModule", { value: true });
		exports$1.SinkStatusSerializer = exports$1.SinkStatus = void 0;
		(function (SinkStatus) {
		    SinkStatus["Enabled"] = "enabled";
		    SinkStatus["Paused"] = "paused";
		    SinkStatus["Disabled"] = "disabled";
		    SinkStatus["Retrying"] = "retrying";
		})(exports$1.SinkStatus || (exports$1.SinkStatus = {}));
		exports$1.SinkStatusSerializer = {
		    _fromJsonObject(object) {
		        return object;
		    },
		    _toJsonObject(self) {
		        return self;
		    },
		};
		
	} (sinkStatus));
	return sinkStatus;
}

var hasRequiredStreamSinkOut;

function requireStreamSinkOut () {
	if (hasRequiredStreamSinkOut) return streamSinkOut;
	hasRequiredStreamSinkOut = 1;
	Object.defineProperty(streamSinkOut, "__esModule", { value: true });
	streamSinkOut.StreamSinkOutSerializer = void 0;
	const azureBlobStorageConfig_1 = requireAzureBlobStorageConfig();
	const googleCloudStorageConfig_1 = requireGoogleCloudStorageConfig();
	const s3Config_1 = requireS3Config();
	const sinkHttpConfig_1 = requireSinkHttpConfig();
	const sinkOtelV1Config_1 = requireSinkOtelV1Config();
	const sinkStatus_1 = requireSinkStatus();
	streamSinkOut.StreamSinkOutSerializer = {
	    _fromJsonObject(object) {
	        const type = object["type"];
	        function getConfig(type) {
	            switch (type) {
	                case "poller":
	                    return {};
	                case "azureBlobStorage":
	                    return azureBlobStorageConfig_1.AzureBlobStorageConfigSerializer._fromJsonObject(object["config"]);
	                case "otelTracing":
	                    return sinkOtelV1Config_1.SinkOtelV1ConfigSerializer._fromJsonObject(object["config"]);
	                case "http":
	                    return sinkHttpConfig_1.SinkHttpConfigSerializer._fromJsonObject(object["config"]);
	                case "amazonS3":
	                    return s3Config_1.S3ConfigSerializer._fromJsonObject(object["config"]);
	                case "googleCloudStorage":
	                    return googleCloudStorageConfig_1.GoogleCloudStorageConfigSerializer._fromJsonObject(object["config"]);
	                default:
	                    throw new Error(`Unexpected type: ${type}`);
	            }
	        }
	        return {
	            type,
	            config: getConfig(type),
	            batchSize: object["batchSize"],
	            createdAt: new Date(object["createdAt"]),
	            currentIterator: object["currentIterator"],
	            eventTypes: object["eventTypes"],
	            failureReason: object["failureReason"],
	            id: object["id"],
	            maxWaitSecs: object["maxWaitSecs"],
	            metadata: object["metadata"],
	            nextRetryAt: object["nextRetryAt"] ? new Date(object["nextRetryAt"]) : null,
	            status: sinkStatus_1.SinkStatusSerializer._fromJsonObject(object["status"]),
	            uid: object["uid"],
	            updatedAt: new Date(object["updatedAt"]),
	        };
	    },
	    _toJsonObject(self) {
	        let config;
	        switch (self.type) {
	            case "poller":
	                config = {};
	                break;
	            case "azureBlobStorage":
	                config = azureBlobStorageConfig_1.AzureBlobStorageConfigSerializer._toJsonObject(self.config);
	                break;
	            case "otelTracing":
	                config = sinkOtelV1Config_1.SinkOtelV1ConfigSerializer._toJsonObject(self.config);
	                break;
	            case "http":
	                config = sinkHttpConfig_1.SinkHttpConfigSerializer._toJsonObject(self.config);
	                break;
	            case "amazonS3":
	                config = s3Config_1.S3ConfigSerializer._toJsonObject(self.config);
	                break;
	            case "googleCloudStorage":
	                config = googleCloudStorageConfig_1.GoogleCloudStorageConfigSerializer._toJsonObject(self.config);
	                break;
	        }
	        return {
	            type: self.type,
	            config: config,
	            batchSize: self.batchSize,
	            createdAt: self.createdAt,
	            currentIterator: self.currentIterator,
	            eventTypes: self.eventTypes,
	            failureReason: self.failureReason,
	            id: self.id,
	            maxWaitSecs: self.maxWaitSecs,
	            metadata: self.metadata,
	            nextRetryAt: self.nextRetryAt,
	            status: sinkStatus_1.SinkStatusSerializer._toJsonObject(self.status),
	            uid: self.uid,
	            updatedAt: self.updatedAt,
	        };
	    },
	};
	
	return streamSinkOut;
}

var hasRequiredListResponseStreamSinkOut;

function requireListResponseStreamSinkOut () {
	if (hasRequiredListResponseStreamSinkOut) return listResponseStreamSinkOut;
	hasRequiredListResponseStreamSinkOut = 1;
	Object.defineProperty(listResponseStreamSinkOut, "__esModule", { value: true });
	listResponseStreamSinkOut.ListResponseStreamSinkOutSerializer = void 0;
	const streamSinkOut_1 = requireStreamSinkOut();
	listResponseStreamSinkOut.ListResponseStreamSinkOutSerializer = {
	    _fromJsonObject(object) {
	        return {
	            data: object["data"].map((item) => streamSinkOut_1.StreamSinkOutSerializer._fromJsonObject(item)),
	            done: object["done"],
	            iterator: object["iterator"],
	            prevIterator: object["prevIterator"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            data: self.data.map((item) => streamSinkOut_1.StreamSinkOutSerializer._toJsonObject(item)),
	            done: self.done,
	            iterator: self.iterator,
	            prevIterator: self.prevIterator,
	        };
	    },
	};
	
	return listResponseStreamSinkOut;
}

var sinkSecretOut = {};

var hasRequiredSinkSecretOut;

function requireSinkSecretOut () {
	if (hasRequiredSinkSecretOut) return sinkSecretOut;
	hasRequiredSinkSecretOut = 1;
	Object.defineProperty(sinkSecretOut, "__esModule", { value: true });
	sinkSecretOut.SinkSecretOutSerializer = void 0;
	sinkSecretOut.SinkSecretOutSerializer = {
	    _fromJsonObject(object) {
	        return {
	            key: object["key"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            key: self.key,
	        };
	    },
	};
	
	return sinkSecretOut;
}

var sinkTransformIn = {};

var hasRequiredSinkTransformIn;

function requireSinkTransformIn () {
	if (hasRequiredSinkTransformIn) return sinkTransformIn;
	hasRequiredSinkTransformIn = 1;
	Object.defineProperty(sinkTransformIn, "__esModule", { value: true });
	sinkTransformIn.SinkTransformInSerializer = void 0;
	sinkTransformIn.SinkTransformInSerializer = {
	    _fromJsonObject(object) {
	        return {
	            code: object["code"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            code: self.code,
	        };
	    },
	};
	
	return sinkTransformIn;
}

var streamSinkIn = {};

var sinkStatusIn = {};

var hasRequiredSinkStatusIn;

function requireSinkStatusIn () {
	if (hasRequiredSinkStatusIn) return sinkStatusIn;
	hasRequiredSinkStatusIn = 1;
	(function (exports$1) {
		Object.defineProperty(exports$1, "__esModule", { value: true });
		exports$1.SinkStatusInSerializer = exports$1.SinkStatusIn = void 0;
		(function (SinkStatusIn) {
		    SinkStatusIn["Enabled"] = "enabled";
		    SinkStatusIn["Disabled"] = "disabled";
		})(exports$1.SinkStatusIn || (exports$1.SinkStatusIn = {}));
		exports$1.SinkStatusInSerializer = {
		    _fromJsonObject(object) {
		        return object;
		    },
		    _toJsonObject(self) {
		        return self;
		    },
		};
		
	} (sinkStatusIn));
	return sinkStatusIn;
}

var hasRequiredStreamSinkIn;

function requireStreamSinkIn () {
	if (hasRequiredStreamSinkIn) return streamSinkIn;
	hasRequiredStreamSinkIn = 1;
	Object.defineProperty(streamSinkIn, "__esModule", { value: true });
	streamSinkIn.StreamSinkInSerializer = void 0;
	const azureBlobStorageConfig_1 = requireAzureBlobStorageConfig();
	const googleCloudStorageConfig_1 = requireGoogleCloudStorageConfig();
	const s3Config_1 = requireS3Config();
	const sinkHttpConfig_1 = requireSinkHttpConfig();
	const sinkOtelV1Config_1 = requireSinkOtelV1Config();
	const sinkStatusIn_1 = requireSinkStatusIn();
	streamSinkIn.StreamSinkInSerializer = {
	    _fromJsonObject(object) {
	        const type = object["type"];
	        function getConfig(type) {
	            switch (type) {
	                case "poller":
	                    return {};
	                case "azureBlobStorage":
	                    return azureBlobStorageConfig_1.AzureBlobStorageConfigSerializer._fromJsonObject(object["config"]);
	                case "otelTracing":
	                    return sinkOtelV1Config_1.SinkOtelV1ConfigSerializer._fromJsonObject(object["config"]);
	                case "http":
	                    return sinkHttpConfig_1.SinkHttpConfigSerializer._fromJsonObject(object["config"]);
	                case "amazonS3":
	                    return s3Config_1.S3ConfigSerializer._fromJsonObject(object["config"]);
	                case "googleCloudStorage":
	                    return googleCloudStorageConfig_1.GoogleCloudStorageConfigSerializer._fromJsonObject(object["config"]);
	                default:
	                    throw new Error(`Unexpected type: ${type}`);
	            }
	        }
	        return {
	            type,
	            config: getConfig(type),
	            batchSize: object["batchSize"],
	            eventTypes: object["eventTypes"],
	            maxWaitSecs: object["maxWaitSecs"],
	            metadata: object["metadata"],
	            status: object["status"] != null
	                ? sinkStatusIn_1.SinkStatusInSerializer._fromJsonObject(object["status"])
	                : undefined,
	            uid: object["uid"],
	        };
	    },
	    _toJsonObject(self) {
	        let config;
	        switch (self.type) {
	            case "poller":
	                config = {};
	                break;
	            case "azureBlobStorage":
	                config = azureBlobStorageConfig_1.AzureBlobStorageConfigSerializer._toJsonObject(self.config);
	                break;
	            case "otelTracing":
	                config = sinkOtelV1Config_1.SinkOtelV1ConfigSerializer._toJsonObject(self.config);
	                break;
	            case "http":
	                config = sinkHttpConfig_1.SinkHttpConfigSerializer._toJsonObject(self.config);
	                break;
	            case "amazonS3":
	                config = s3Config_1.S3ConfigSerializer._toJsonObject(self.config);
	                break;
	            case "googleCloudStorage":
	                config = googleCloudStorageConfig_1.GoogleCloudStorageConfigSerializer._toJsonObject(self.config);
	                break;
	        }
	        return {
	            type: self.type,
	            config: config,
	            batchSize: self.batchSize,
	            eventTypes: self.eventTypes,
	            maxWaitSecs: self.maxWaitSecs,
	            metadata: self.metadata,
	            status: self.status != null
	                ? sinkStatusIn_1.SinkStatusInSerializer._toJsonObject(self.status)
	                : undefined,
	            uid: self.uid,
	        };
	    },
	};
	
	return streamSinkIn;
}

var streamSinkPatch = {};

var amazonS3PatchConfig = {};

var hasRequiredAmazonS3PatchConfig;

function requireAmazonS3PatchConfig () {
	if (hasRequiredAmazonS3PatchConfig) return amazonS3PatchConfig;
	hasRequiredAmazonS3PatchConfig = 1;
	Object.defineProperty(amazonS3PatchConfig, "__esModule", { value: true });
	amazonS3PatchConfig.AmazonS3PatchConfigSerializer = void 0;
	amazonS3PatchConfig.AmazonS3PatchConfigSerializer = {
	    _fromJsonObject(object) {
	        return {
	            accessKeyId: object["accessKeyId"],
	            bucket: object["bucket"],
	            endpointUrl: object["endpointUrl"],
	            region: object["region"],
	            secretAccessKey: object["secretAccessKey"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            accessKeyId: self.accessKeyId,
	            bucket: self.bucket,
	            endpointUrl: self.endpointUrl,
	            region: self.region,
	            secretAccessKey: self.secretAccessKey,
	        };
	    },
	};
	
	return amazonS3PatchConfig;
}

var azureBlobStoragePatchConfig = {};

var hasRequiredAzureBlobStoragePatchConfig;

function requireAzureBlobStoragePatchConfig () {
	if (hasRequiredAzureBlobStoragePatchConfig) return azureBlobStoragePatchConfig;
	hasRequiredAzureBlobStoragePatchConfig = 1;
	Object.defineProperty(azureBlobStoragePatchConfig, "__esModule", { value: true });
	azureBlobStoragePatchConfig.AzureBlobStoragePatchConfigSerializer = void 0;
	azureBlobStoragePatchConfig.AzureBlobStoragePatchConfigSerializer = {
	    _fromJsonObject(object) {
	        return {
	            accessKey: object["accessKey"],
	            account: object["account"],
	            container: object["container"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            accessKey: self.accessKey,
	            account: self.account,
	            container: self.container,
	        };
	    },
	};
	
	return azureBlobStoragePatchConfig;
}

var googleCloudStoragePatchConfig = {};

var hasRequiredGoogleCloudStoragePatchConfig;

function requireGoogleCloudStoragePatchConfig () {
	if (hasRequiredGoogleCloudStoragePatchConfig) return googleCloudStoragePatchConfig;
	hasRequiredGoogleCloudStoragePatchConfig = 1;
	Object.defineProperty(googleCloudStoragePatchConfig, "__esModule", { value: true });
	googleCloudStoragePatchConfig.GoogleCloudStoragePatchConfigSerializer = void 0;
	googleCloudStoragePatchConfig.GoogleCloudStoragePatchConfigSerializer = {
	    _fromJsonObject(object) {
	        return {
	            bucket: object["bucket"],
	            credentials: object["credentials"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            bucket: self.bucket,
	            credentials: self.credentials,
	        };
	    },
	};
	
	return googleCloudStoragePatchConfig;
}

var httpPatchConfig = {};

var hasRequiredHttpPatchConfig;

function requireHttpPatchConfig () {
	if (hasRequiredHttpPatchConfig) return httpPatchConfig;
	hasRequiredHttpPatchConfig = 1;
	Object.defineProperty(httpPatchConfig, "__esModule", { value: true });
	httpPatchConfig.HttpPatchConfigSerializer = void 0;
	httpPatchConfig.HttpPatchConfigSerializer = {
	    _fromJsonObject(object) {
	        return {
	            url: object["url"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            url: self.url,
	        };
	    },
	};
	
	return httpPatchConfig;
}

var otelTracingPatchConfig = {};

var hasRequiredOtelTracingPatchConfig;

function requireOtelTracingPatchConfig () {
	if (hasRequiredOtelTracingPatchConfig) return otelTracingPatchConfig;
	hasRequiredOtelTracingPatchConfig = 1;
	Object.defineProperty(otelTracingPatchConfig, "__esModule", { value: true });
	otelTracingPatchConfig.OtelTracingPatchConfigSerializer = void 0;
	otelTracingPatchConfig.OtelTracingPatchConfigSerializer = {
	    _fromJsonObject(object) {
	        return {
	            url: object["url"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            url: self.url,
	        };
	    },
	};
	
	return otelTracingPatchConfig;
}

var hasRequiredStreamSinkPatch;

function requireStreamSinkPatch () {
	if (hasRequiredStreamSinkPatch) return streamSinkPatch;
	hasRequiredStreamSinkPatch = 1;
	Object.defineProperty(streamSinkPatch, "__esModule", { value: true });
	streamSinkPatch.StreamSinkPatchSerializer = void 0;
	const amazonS3PatchConfig_1 = requireAmazonS3PatchConfig();
	const azureBlobStoragePatchConfig_1 = requireAzureBlobStoragePatchConfig();
	const googleCloudStoragePatchConfig_1 = requireGoogleCloudStoragePatchConfig();
	const httpPatchConfig_1 = requireHttpPatchConfig();
	const otelTracingPatchConfig_1 = requireOtelTracingPatchConfig();
	const sinkStatusIn_1 = requireSinkStatusIn();
	streamSinkPatch.StreamSinkPatchSerializer = {
	    _fromJsonObject(object) {
	        const type = object["type"];
	        function getConfig(type) {
	            switch (type) {
	                case "poller":
	                    return {};
	                case "azureBlobStorage":
	                    return azureBlobStoragePatchConfig_1.AzureBlobStoragePatchConfigSerializer._fromJsonObject(object["config"]);
	                case "otelTracing":
	                    return otelTracingPatchConfig_1.OtelTracingPatchConfigSerializer._fromJsonObject(object["config"]);
	                case "http":
	                    return httpPatchConfig_1.HttpPatchConfigSerializer._fromJsonObject(object["config"]);
	                case "amazonS3":
	                    return amazonS3PatchConfig_1.AmazonS3PatchConfigSerializer._fromJsonObject(object["config"]);
	                case "googleCloudStorage":
	                    return googleCloudStoragePatchConfig_1.GoogleCloudStoragePatchConfigSerializer._fromJsonObject(object["config"]);
	                default:
	                    throw new Error(`Unexpected type: ${type}`);
	            }
	        }
	        return {
	            type,
	            config: getConfig(type),
	            batchSize: object["batchSize"],
	            eventTypes: object["eventTypes"],
	            maxWaitSecs: object["maxWaitSecs"],
	            metadata: object["metadata"],
	            status: object["status"] != null
	                ? sinkStatusIn_1.SinkStatusInSerializer._fromJsonObject(object["status"])
	                : undefined,
	            uid: object["uid"],
	        };
	    },
	    _toJsonObject(self) {
	        let config;
	        switch (self.type) {
	            case "poller":
	                config = {};
	                break;
	            case "azureBlobStorage":
	                config = azureBlobStoragePatchConfig_1.AzureBlobStoragePatchConfigSerializer._toJsonObject(self.config);
	                break;
	            case "otelTracing":
	                config = otelTracingPatchConfig_1.OtelTracingPatchConfigSerializer._toJsonObject(self.config);
	                break;
	            case "http":
	                config = httpPatchConfig_1.HttpPatchConfigSerializer._toJsonObject(self.config);
	                break;
	            case "amazonS3":
	                config = amazonS3PatchConfig_1.AmazonS3PatchConfigSerializer._toJsonObject(self.config);
	                break;
	            case "googleCloudStorage":
	                config = googleCloudStoragePatchConfig_1.GoogleCloudStoragePatchConfigSerializer._toJsonObject(self.config);
	                break;
	        }
	        return {
	            type: self.type,
	            config: config,
	            batchSize: self.batchSize,
	            eventTypes: self.eventTypes,
	            maxWaitSecs: self.maxWaitSecs,
	            metadata: self.metadata,
	            status: self.status != null
	                ? sinkStatusIn_1.SinkStatusInSerializer._toJsonObject(self.status)
	                : undefined,
	            uid: self.uid,
	        };
	    },
	};
	
	return streamSinkPatch;
}

var hasRequiredStreamingSink;

function requireStreamingSink () {
	if (hasRequiredStreamingSink) return streamingSink;
	hasRequiredStreamingSink = 1;
	Object.defineProperty(streamingSink, "__esModule", { value: true });
	streamingSink.StreamingSink = void 0;
	const emptyResponse_1 = requireEmptyResponse();
	const endpointSecretRotateIn_1 = requireEndpointSecretRotateIn();
	const listResponseStreamSinkOut_1 = requireListResponseStreamSinkOut();
	const sinkSecretOut_1 = requireSinkSecretOut();
	const sinkTransformIn_1 = requireSinkTransformIn();
	const streamSinkIn_1 = requireStreamSinkIn();
	const streamSinkOut_1 = requireStreamSinkOut();
	const streamSinkPatch_1 = requireStreamSinkPatch();
	const request_1 = requireRequest();
	class StreamingSink {
	    constructor(requestCtx) {
	        this.requestCtx = requestCtx;
	    }
	    list(streamId, options) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/stream/{stream_id}/sink");
	        request.setPathParam("stream_id", streamId);
	        request.setQueryParams({
	            limit: options === null || options === void 0 ? void 0 : options.limit,
	            iterator: options === null || options === void 0 ? void 0 : options.iterator,
	            order: options === null || options === void 0 ? void 0 : options.order,
	        });
	        return request.send(this.requestCtx, listResponseStreamSinkOut_1.ListResponseStreamSinkOutSerializer._fromJsonObject);
	    }
	    create(streamId, streamSinkIn, options) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/stream/{stream_id}/sink");
	        request.setPathParam("stream_id", streamId);
	        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
	        request.setBody(streamSinkIn_1.StreamSinkInSerializer._toJsonObject(streamSinkIn));
	        return request.send(this.requestCtx, streamSinkOut_1.StreamSinkOutSerializer._fromJsonObject);
	    }
	    get(streamId, sinkId) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/stream/{stream_id}/sink/{sink_id}");
	        request.setPathParam("stream_id", streamId);
	        request.setPathParam("sink_id", sinkId);
	        return request.send(this.requestCtx, streamSinkOut_1.StreamSinkOutSerializer._fromJsonObject);
	    }
	    update(streamId, sinkId, streamSinkIn) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.PUT, "/api/v1/stream/{stream_id}/sink/{sink_id}");
	        request.setPathParam("stream_id", streamId);
	        request.setPathParam("sink_id", sinkId);
	        request.setBody(streamSinkIn_1.StreamSinkInSerializer._toJsonObject(streamSinkIn));
	        return request.send(this.requestCtx, streamSinkOut_1.StreamSinkOutSerializer._fromJsonObject);
	    }
	    delete(streamId, sinkId) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.DELETE, "/api/v1/stream/{stream_id}/sink/{sink_id}");
	        request.setPathParam("stream_id", streamId);
	        request.setPathParam("sink_id", sinkId);
	        return request.sendNoResponseBody(this.requestCtx);
	    }
	    patch(streamId, sinkId, streamSinkPatch) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.PATCH, "/api/v1/stream/{stream_id}/sink/{sink_id}");
	        request.setPathParam("stream_id", streamId);
	        request.setPathParam("sink_id", sinkId);
	        request.setBody(streamSinkPatch_1.StreamSinkPatchSerializer._toJsonObject(streamSinkPatch));
	        return request.send(this.requestCtx, streamSinkOut_1.StreamSinkOutSerializer._fromJsonObject);
	    }
	    getSecret(streamId, sinkId) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/stream/{stream_id}/sink/{sink_id}/secret");
	        request.setPathParam("stream_id", streamId);
	        request.setPathParam("sink_id", sinkId);
	        return request.send(this.requestCtx, sinkSecretOut_1.SinkSecretOutSerializer._fromJsonObject);
	    }
	    rotateSecret(streamId, sinkId, endpointSecretRotateIn, options) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/stream/{stream_id}/sink/{sink_id}/secret/rotate");
	        request.setPathParam("stream_id", streamId);
	        request.setPathParam("sink_id", sinkId);
	        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
	        request.setBody(endpointSecretRotateIn_1.EndpointSecretRotateInSerializer._toJsonObject(endpointSecretRotateIn));
	        return request.send(this.requestCtx, emptyResponse_1.EmptyResponseSerializer._fromJsonObject);
	    }
	    transformationPartialUpdate(streamId, sinkId, sinkTransformIn) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.PATCH, "/api/v1/stream/{stream_id}/sink/{sink_id}/transformation");
	        request.setPathParam("stream_id", streamId);
	        request.setPathParam("sink_id", sinkId);
	        request.setBody(sinkTransformIn_1.SinkTransformInSerializer._toJsonObject(sinkTransformIn));
	        return request.send(this.requestCtx, emptyResponse_1.EmptyResponseSerializer._fromJsonObject);
	    }
	}
	streamingSink.StreamingSink = StreamingSink;
	
	return streamingSink;
}

var streamingStream = {};

var listResponseStreamOut = {};

var streamOut = {};

var hasRequiredStreamOut;

function requireStreamOut () {
	if (hasRequiredStreamOut) return streamOut;
	hasRequiredStreamOut = 1;
	Object.defineProperty(streamOut, "__esModule", { value: true });
	streamOut.StreamOutSerializer = void 0;
	streamOut.StreamOutSerializer = {
	    _fromJsonObject(object) {
	        return {
	            createdAt: new Date(object["createdAt"]),
	            id: object["id"],
	            metadata: object["metadata"],
	            name: object["name"],
	            uid: object["uid"],
	            updatedAt: new Date(object["updatedAt"]),
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            createdAt: self.createdAt,
	            id: self.id,
	            metadata: self.metadata,
	            name: self.name,
	            uid: self.uid,
	            updatedAt: self.updatedAt,
	        };
	    },
	};
	
	return streamOut;
}

var hasRequiredListResponseStreamOut;

function requireListResponseStreamOut () {
	if (hasRequiredListResponseStreamOut) return listResponseStreamOut;
	hasRequiredListResponseStreamOut = 1;
	Object.defineProperty(listResponseStreamOut, "__esModule", { value: true });
	listResponseStreamOut.ListResponseStreamOutSerializer = void 0;
	const streamOut_1 = requireStreamOut();
	listResponseStreamOut.ListResponseStreamOutSerializer = {
	    _fromJsonObject(object) {
	        return {
	            data: object["data"].map((item) => streamOut_1.StreamOutSerializer._fromJsonObject(item)),
	            done: object["done"],
	            iterator: object["iterator"],
	            prevIterator: object["prevIterator"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            data: self.data.map((item) => streamOut_1.StreamOutSerializer._toJsonObject(item)),
	            done: self.done,
	            iterator: self.iterator,
	            prevIterator: self.prevIterator,
	        };
	    },
	};
	
	return listResponseStreamOut;
}

var streamPatch = {};

var hasRequiredStreamPatch;

function requireStreamPatch () {
	if (hasRequiredStreamPatch) return streamPatch;
	hasRequiredStreamPatch = 1;
	Object.defineProperty(streamPatch, "__esModule", { value: true });
	streamPatch.StreamPatchSerializer = void 0;
	streamPatch.StreamPatchSerializer = {
	    _fromJsonObject(object) {
	        return {
	            description: object["description"],
	            metadata: object["metadata"],
	            uid: object["uid"],
	        };
	    },
	    _toJsonObject(self) {
	        return {
	            description: self.description,
	            metadata: self.metadata,
	            uid: self.uid,
	        };
	    },
	};
	
	return streamPatch;
}

var hasRequiredStreamingStream;

function requireStreamingStream () {
	if (hasRequiredStreamingStream) return streamingStream;
	hasRequiredStreamingStream = 1;
	Object.defineProperty(streamingStream, "__esModule", { value: true });
	streamingStream.StreamingStream = void 0;
	const listResponseStreamOut_1 = requireListResponseStreamOut();
	const streamIn_1 = requireStreamIn();
	const streamOut_1 = requireStreamOut();
	const streamPatch_1 = requireStreamPatch();
	const request_1 = requireRequest();
	class StreamingStream {
	    constructor(requestCtx) {
	        this.requestCtx = requestCtx;
	    }
	    list(options) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/stream");
	        request.setQueryParams({
	            limit: options === null || options === void 0 ? void 0 : options.limit,
	            iterator: options === null || options === void 0 ? void 0 : options.iterator,
	            order: options === null || options === void 0 ? void 0 : options.order,
	        });
	        return request.send(this.requestCtx, listResponseStreamOut_1.ListResponseStreamOutSerializer._fromJsonObject);
	    }
	    create(streamIn, options) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/stream");
	        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
	        request.setBody(streamIn_1.StreamInSerializer._toJsonObject(streamIn));
	        return request.send(this.requestCtx, streamOut_1.StreamOutSerializer._fromJsonObject);
	    }
	    get(streamId) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/stream/{stream_id}");
	        request.setPathParam("stream_id", streamId);
	        return request.send(this.requestCtx, streamOut_1.StreamOutSerializer._fromJsonObject);
	    }
	    update(streamId, streamIn) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.PUT, "/api/v1/stream/{stream_id}");
	        request.setPathParam("stream_id", streamId);
	        request.setBody(streamIn_1.StreamInSerializer._toJsonObject(streamIn));
	        return request.send(this.requestCtx, streamOut_1.StreamOutSerializer._fromJsonObject);
	    }
	    delete(streamId) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.DELETE, "/api/v1/stream/{stream_id}");
	        request.setPathParam("stream_id", streamId);
	        return request.sendNoResponseBody(this.requestCtx);
	    }
	    patch(streamId, streamPatch) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.PATCH, "/api/v1/stream/{stream_id}");
	        request.setPathParam("stream_id", streamId);
	        request.setBody(streamPatch_1.StreamPatchSerializer._toJsonObject(streamPatch));
	        return request.send(this.requestCtx, streamOut_1.StreamOutSerializer._fromJsonObject);
	    }
	}
	streamingStream.StreamingStream = StreamingStream;
	
	return streamingStream;
}

var hasRequiredStreaming;

function requireStreaming () {
	if (hasRequiredStreaming) return streaming;
	hasRequiredStreaming = 1;
	Object.defineProperty(streaming, "__esModule", { value: true });
	streaming.Streaming = void 0;
	const endpointHeadersOut_1 = requireEndpointHeadersOut();
	const httpSinkHeadersPatchIn_1 = requireHttpSinkHeadersPatchIn();
	const sinkTransformationOut_1 = requireSinkTransformationOut();
	const streamingEventType_1 = requireStreamingEventType();
	const streamingEvents_1 = requireStreamingEvents();
	const streamingSink_1 = requireStreamingSink();
	const streamingStream_1 = requireStreamingStream();
	const request_1 = requireRequest();
	class Streaming {
	    constructor(requestCtx) {
	        this.requestCtx = requestCtx;
	    }
	    get event_type() {
	        return new streamingEventType_1.StreamingEventType(this.requestCtx);
	    }
	    get events() {
	        return new streamingEvents_1.StreamingEvents(this.requestCtx);
	    }
	    get sink() {
	        return new streamingSink_1.StreamingSink(this.requestCtx);
	    }
	    get stream() {
	        return new streamingStream_1.StreamingStream(this.requestCtx);
	    }
	    sinkHeadersGet(streamId, sinkId) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/stream/{stream_id}/sink/{sink_id}/headers");
	        request.setPathParam("stream_id", streamId);
	        request.setPathParam("sink_id", sinkId);
	        return request.send(this.requestCtx, endpointHeadersOut_1.EndpointHeadersOutSerializer._fromJsonObject);
	    }
	    sinkHeadersPatch(streamId, sinkId, httpSinkHeadersPatchIn) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.PATCH, "/api/v1/stream/{stream_id}/sink/{sink_id}/headers");
	        request.setPathParam("stream_id", streamId);
	        request.setPathParam("sink_id", sinkId);
	        request.setBody(httpSinkHeadersPatchIn_1.HttpSinkHeadersPatchInSerializer._toJsonObject(httpSinkHeadersPatchIn));
	        return request.send(this.requestCtx, endpointHeadersOut_1.EndpointHeadersOutSerializer._fromJsonObject);
	    }
	    sinkTransformationGet(streamId, sinkId) {
	        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/stream/{stream_id}/sink/{sink_id}/transformation");
	        request.setPathParam("stream_id", streamId);
	        request.setPathParam("sink_id", sinkId);
	        return request.send(this.requestCtx, sinkTransformationOut_1.SinkTransformationOutSerializer._fromJsonObject);
	    }
	}
	streaming.Streaming = Streaming;
	
	return streaming;
}

var HttpErrors = {};

var hasRequiredHttpErrors;

function requireHttpErrors () {
	if (hasRequiredHttpErrors) return HttpErrors;
	hasRequiredHttpErrors = 1;
	Object.defineProperty(HttpErrors, "__esModule", { value: true });
	HttpErrors.HTTPValidationError = HttpErrors.ValidationError = HttpErrors.HttpErrorOut = void 0;
	class HttpErrorOut {
	    static getAttributeTypeMap() {
	        return HttpErrorOut.attributeTypeMap;
	    }
	}
	HttpErrors.HttpErrorOut = HttpErrorOut;
	HttpErrorOut.discriminator = undefined;
	HttpErrorOut.mapping = undefined;
	HttpErrorOut.attributeTypeMap = [
	    {
	        name: "code",
	        baseName: "code",
	        type: "string",
	        format: "",
	    },
	    {
	        name: "detail",
	        baseName: "detail",
	        type: "string",
	        format: "",
	    },
	];
	class ValidationError {
	    static getAttributeTypeMap() {
	        return ValidationError.attributeTypeMap;
	    }
	}
	HttpErrors.ValidationError = ValidationError;
	ValidationError.discriminator = undefined;
	ValidationError.mapping = undefined;
	ValidationError.attributeTypeMap = [
	    {
	        name: "loc",
	        baseName: "loc",
	        type: "Array<string>",
	        format: "",
	    },
	    {
	        name: "msg",
	        baseName: "msg",
	        type: "string",
	        format: "",
	    },
	    {
	        name: "type",
	        baseName: "type",
	        type: "string",
	        format: "",
	    },
	];
	class HTTPValidationError {
	    static getAttributeTypeMap() {
	        return HTTPValidationError.attributeTypeMap;
	    }
	}
	HttpErrors.HTTPValidationError = HTTPValidationError;
	HTTPValidationError.discriminator = undefined;
	HTTPValidationError.mapping = undefined;
	HTTPValidationError.attributeTypeMap = [
	    {
	        name: "detail",
	        baseName: "detail",
	        type: "Array<ValidationError>",
	        format: "",
	    },
	];
	
	return HttpErrors;
}

var webhook = {};

var dist = {};

var timing_safe_equal = {};

var hasRequiredTiming_safe_equal;

function requireTiming_safe_equal () {
	if (hasRequiredTiming_safe_equal) return timing_safe_equal;
	hasRequiredTiming_safe_equal = 1;
	Object.defineProperty(timing_safe_equal, "__esModule", { value: true });
	timing_safe_equal.timingSafeEqual = void 0;
	function assert(expr, msg = "") {
	    if (!expr) {
	        throw new Error(msg);
	    }
	}
	function timingSafeEqual(a, b) {
	    if (a.byteLength !== b.byteLength) {
	        return false;
	    }
	    if (!(a instanceof DataView)) {
	        a = new DataView(ArrayBuffer.isView(a) ? a.buffer : a);
	    }
	    if (!(b instanceof DataView)) {
	        b = new DataView(ArrayBuffer.isView(b) ? b.buffer : b);
	    }
	    assert(a instanceof DataView);
	    assert(b instanceof DataView);
	    const length = a.byteLength;
	    let out = 0;
	    let i = -1;
	    while (++i < length) {
	        out |= a.getUint8(i) ^ b.getUint8(i);
	    }
	    return out === 0;
	}
	timing_safe_equal.timingSafeEqual = timingSafeEqual;
	
	return timing_safe_equal;
}

var base64 = {};

var hasRequiredBase64;

function requireBase64 () {
	if (hasRequiredBase64) return base64;
	hasRequiredBase64 = 1;
	// Copyright (C) 2016 Dmitry Chestnykh
	// MIT License. See LICENSE file for details.
	var __extends = (base64 && base64.__extends) || (function () {
	    var extendStatics = function (d, b) {
	        extendStatics = Object.setPrototypeOf ||
	            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
	            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
	        return extendStatics(d, b);
	    };
	    return function (d, b) {
	        extendStatics(d, b);
	        function __() { this.constructor = d; }
	        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	    };
	})();
	Object.defineProperty(base64, "__esModule", { value: true });
	/**
	 * Package base64 implements Base64 encoding and decoding.
	 */
	// Invalid character used in decoding to indicate
	// that the character to decode is out of range of
	// alphabet and cannot be decoded.
	var INVALID_BYTE = 256;
	/**
	 * Implements standard Base64 encoding.
	 *
	 * Operates in constant time.
	 */
	var Coder = /** @class */ (function () {
	    // TODO(dchest): methods to encode chunk-by-chunk.
	    function Coder(_paddingCharacter) {
	        if (_paddingCharacter === void 0) { _paddingCharacter = "="; }
	        this._paddingCharacter = _paddingCharacter;
	    }
	    Coder.prototype.encodedLength = function (length) {
	        if (!this._paddingCharacter) {
	            return (length * 8 + 5) / 6 | 0;
	        }
	        return (length + 2) / 3 * 4 | 0;
	    };
	    Coder.prototype.encode = function (data) {
	        var out = "";
	        var i = 0;
	        for (; i < data.length - 2; i += 3) {
	            var c = (data[i] << 16) | (data[i + 1] << 8) | (data[i + 2]);
	            out += this._encodeByte((c >>> 3 * 6) & 63);
	            out += this._encodeByte((c >>> 2 * 6) & 63);
	            out += this._encodeByte((c >>> 1 * 6) & 63);
	            out += this._encodeByte((c >>> 0 * 6) & 63);
	        }
	        var left = data.length - i;
	        if (left > 0) {
	            var c = (data[i] << 16) | (left === 2 ? data[i + 1] << 8 : 0);
	            out += this._encodeByte((c >>> 3 * 6) & 63);
	            out += this._encodeByte((c >>> 2 * 6) & 63);
	            if (left === 2) {
	                out += this._encodeByte((c >>> 1 * 6) & 63);
	            }
	            else {
	                out += this._paddingCharacter || "";
	            }
	            out += this._paddingCharacter || "";
	        }
	        return out;
	    };
	    Coder.prototype.maxDecodedLength = function (length) {
	        if (!this._paddingCharacter) {
	            return (length * 6 + 7) / 8 | 0;
	        }
	        return length / 4 * 3 | 0;
	    };
	    Coder.prototype.decodedLength = function (s) {
	        return this.maxDecodedLength(s.length - this._getPaddingLength(s));
	    };
	    Coder.prototype.decode = function (s) {
	        if (s.length === 0) {
	            return new Uint8Array(0);
	        }
	        var paddingLength = this._getPaddingLength(s);
	        var length = s.length - paddingLength;
	        var out = new Uint8Array(this.maxDecodedLength(length));
	        var op = 0;
	        var i = 0;
	        var haveBad = 0;
	        var v0 = 0, v1 = 0, v2 = 0, v3 = 0;
	        for (; i < length - 4; i += 4) {
	            v0 = this._decodeChar(s.charCodeAt(i + 0));
	            v1 = this._decodeChar(s.charCodeAt(i + 1));
	            v2 = this._decodeChar(s.charCodeAt(i + 2));
	            v3 = this._decodeChar(s.charCodeAt(i + 3));
	            out[op++] = (v0 << 2) | (v1 >>> 4);
	            out[op++] = (v1 << 4) | (v2 >>> 2);
	            out[op++] = (v2 << 6) | v3;
	            haveBad |= v0 & INVALID_BYTE;
	            haveBad |= v1 & INVALID_BYTE;
	            haveBad |= v2 & INVALID_BYTE;
	            haveBad |= v3 & INVALID_BYTE;
	        }
	        if (i < length - 1) {
	            v0 = this._decodeChar(s.charCodeAt(i));
	            v1 = this._decodeChar(s.charCodeAt(i + 1));
	            out[op++] = (v0 << 2) | (v1 >>> 4);
	            haveBad |= v0 & INVALID_BYTE;
	            haveBad |= v1 & INVALID_BYTE;
	        }
	        if (i < length - 2) {
	            v2 = this._decodeChar(s.charCodeAt(i + 2));
	            out[op++] = (v1 << 4) | (v2 >>> 2);
	            haveBad |= v2 & INVALID_BYTE;
	        }
	        if (i < length - 3) {
	            v3 = this._decodeChar(s.charCodeAt(i + 3));
	            out[op++] = (v2 << 6) | v3;
	            haveBad |= v3 & INVALID_BYTE;
	        }
	        if (haveBad !== 0) {
	            throw new Error("Base64Coder: incorrect characters for decoding");
	        }
	        return out;
	    };
	    // Standard encoding have the following encoded/decoded ranges,
	    // which we need to convert between.
	    //
	    // ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789  +   /
	    // Index:   0 - 25                    26 - 51              52 - 61   62  63
	    // ASCII:  65 - 90                    97 - 122             48 - 57   43  47
	    //
	    // Encode 6 bits in b into a new character.
	    Coder.prototype._encodeByte = function (b) {
	        // Encoding uses constant time operations as follows:
	        //
	        // 1. Define comparison of A with B using (A - B) >>> 8:
	        //          if A > B, then result is positive integer
	        //          if A <= B, then result is 0
	        //
	        // 2. Define selection of C or 0 using bitwise AND: X & C:
	        //          if X == 0, then result is 0
	        //          if X != 0, then result is C
	        //
	        // 3. Start with the smallest comparison (b >= 0), which is always
	        //    true, so set the result to the starting ASCII value (65).
	        //
	        // 4. Continue comparing b to higher ASCII values, and selecting
	        //    zero if comparison isn't true, otherwise selecting a value
	        //    to add to result, which:
	        //
	        //          a) undoes the previous addition
	        //          b) provides new value to add
	        //
	        var result = b;
	        // b >= 0
	        result += 65;
	        // b > 25
	        result += ((25 - b) >>> 8) & ((0 - 65) - 26 + 97);
	        // b > 51
	        result += ((51 - b) >>> 8) & ((26 - 97) - 52 + 48);
	        // b > 61
	        result += ((61 - b) >>> 8) & ((52 - 48) - 62 + 43);
	        // b > 62
	        result += ((62 - b) >>> 8) & ((62 - 43) - 63 + 47);
	        return String.fromCharCode(result);
	    };
	    // Decode a character code into a byte.
	    // Must return 256 if character is out of alphabet range.
	    Coder.prototype._decodeChar = function (c) {
	        // Decoding works similar to encoding: using the same comparison
	        // function, but now it works on ranges: result is always incremented
	        // by value, but this value becomes zero if the range is not
	        // satisfied.
	        //
	        // Decoding starts with invalid value, 256, which is then
	        // subtracted when the range is satisfied. If none of the ranges
	        // apply, the function returns 256, which is then checked by
	        // the caller to throw error.
	        var result = INVALID_BYTE; // start with invalid character
	        // c == 43 (c > 42 and c < 44)
	        result += (((42 - c) & (c - 44)) >>> 8) & (-INVALID_BYTE + c - 43 + 62);
	        // c == 47 (c > 46 and c < 48)
	        result += (((46 - c) & (c - 48)) >>> 8) & (-INVALID_BYTE + c - 47 + 63);
	        // c > 47 and c < 58
	        result += (((47 - c) & (c - 58)) >>> 8) & (-INVALID_BYTE + c - 48 + 52);
	        // c > 64 and c < 91
	        result += (((64 - c) & (c - 91)) >>> 8) & (-INVALID_BYTE + c - 65 + 0);
	        // c > 96 and c < 123
	        result += (((96 - c) & (c - 123)) >>> 8) & (-INVALID_BYTE + c - 97 + 26);
	        return result;
	    };
	    Coder.prototype._getPaddingLength = function (s) {
	        var paddingLength = 0;
	        if (this._paddingCharacter) {
	            for (var i = s.length - 1; i >= 0; i--) {
	                if (s[i] !== this._paddingCharacter) {
	                    break;
	                }
	                paddingLength++;
	            }
	            if (s.length < 4 || paddingLength > 2) {
	                throw new Error("Base64Coder: incorrect padding");
	            }
	        }
	        return paddingLength;
	    };
	    return Coder;
	}());
	base64.Coder = Coder;
	var stdCoder = new Coder();
	function encode(data) {
	    return stdCoder.encode(data);
	}
	base64.encode = encode;
	function decode(s) {
	    return stdCoder.decode(s);
	}
	base64.decode = decode;
	/**
	 * Implements URL-safe Base64 encoding.
	 * (Same as Base64, but '+' is replaced with '-', and '/' with '_').
	 *
	 * Operates in constant time.
	 */
	var URLSafeCoder = /** @class */ (function (_super) {
	    __extends(URLSafeCoder, _super);
	    function URLSafeCoder() {
	        return _super !== null && _super.apply(this, arguments) || this;
	    }
	    // URL-safe encoding have the following encoded/decoded ranges:
	    //
	    // ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789  -   _
	    // Index:   0 - 25                    26 - 51              52 - 61   62  63
	    // ASCII:  65 - 90                    97 - 122             48 - 57   45  95
	    //
	    URLSafeCoder.prototype._encodeByte = function (b) {
	        var result = b;
	        // b >= 0
	        result += 65;
	        // b > 25
	        result += ((25 - b) >>> 8) & ((0 - 65) - 26 + 97);
	        // b > 51
	        result += ((51 - b) >>> 8) & ((26 - 97) - 52 + 48);
	        // b > 61
	        result += ((61 - b) >>> 8) & ((52 - 48) - 62 + 45);
	        // b > 62
	        result += ((62 - b) >>> 8) & ((62 - 45) - 63 + 95);
	        return String.fromCharCode(result);
	    };
	    URLSafeCoder.prototype._decodeChar = function (c) {
	        var result = INVALID_BYTE;
	        // c == 45 (c > 44 and c < 46)
	        result += (((44 - c) & (c - 46)) >>> 8) & (-INVALID_BYTE + c - 45 + 62);
	        // c == 95 (c > 94 and c < 96)
	        result += (((94 - c) & (c - 96)) >>> 8) & (-INVALID_BYTE + c - 95 + 63);
	        // c > 47 and c < 58
	        result += (((47 - c) & (c - 58)) >>> 8) & (-INVALID_BYTE + c - 48 + 52);
	        // c > 64 and c < 91
	        result += (((64 - c) & (c - 91)) >>> 8) & (-INVALID_BYTE + c - 65 + 0);
	        // c > 96 and c < 123
	        result += (((96 - c) & (c - 123)) >>> 8) & (-INVALID_BYTE + c - 97 + 26);
	        return result;
	    };
	    return URLSafeCoder;
	}(Coder));
	base64.URLSafeCoder = URLSafeCoder;
	var urlSafeCoder = new URLSafeCoder();
	function encodeURLSafe(data) {
	    return urlSafeCoder.encode(data);
	}
	base64.encodeURLSafe = encodeURLSafe;
	function decodeURLSafe(s) {
	    return urlSafeCoder.decode(s);
	}
	base64.decodeURLSafe = decodeURLSafe;
	base64.encodedLength = function (length) {
	    return stdCoder.encodedLength(length);
	};
	base64.maxDecodedLength = function (length) {
	    return stdCoder.maxDecodedLength(length);
	};
	base64.decodedLength = function (s) {
	    return stdCoder.decodedLength(s);
	};
	
	return base64;
}

var sha256$1 = {exports: {}};

var sha256 = sha256$1.exports;

var hasRequiredSha256;

function requireSha256 () {
	if (hasRequiredSha256) return sha256$1.exports;
	hasRequiredSha256 = 1;
	(function (module) {
		(function (root, factory) {
		    // Hack to make all exports of this module sha256 function object properties.
		    var exports$1 = {};
		    factory(exports$1);
		    var sha256 = exports$1["default"];
		    for (var k in exports$1) {
		        sha256[k] = exports$1[k];
		    }
		        
		    {
		        module.exports = sha256;
		    }
		})(sha256, function(exports$1) {
		exports$1.__esModule = true;
		// SHA-256 (+ HMAC and PBKDF2) for JavaScript.
		//
		// Written in 2014-2016 by Dmitry Chestnykh.
		// Public domain, no warranty.
		//
		// Functions (accept and return Uint8Arrays):
		//
		//   sha256(message) -> hash
		//   sha256.hmac(key, message) -> mac
		//   sha256.pbkdf2(password, salt, rounds, dkLen) -> dk
		//
		//  Classes:
		//
		//   new sha256.Hash()
		//   new sha256.HMAC(key)
		//
		exports$1.digestLength = 32;
		exports$1.blockSize = 64;
		// SHA-256 constants
		var K = new Uint32Array([
		    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b,
		    0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01,
		    0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7,
		    0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc,
		    0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152,
		    0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
		    0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc,
		    0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
		    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819,
		    0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08,
		    0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f,
		    0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
		    0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
		]);
		function hashBlocks(w, v, p, pos, len) {
		    var a, b, c, d, e, f, g, h, u, i, j, t1, t2;
		    while (len >= 64) {
		        a = v[0];
		        b = v[1];
		        c = v[2];
		        d = v[3];
		        e = v[4];
		        f = v[5];
		        g = v[6];
		        h = v[7];
		        for (i = 0; i < 16; i++) {
		            j = pos + i * 4;
		            w[i] = (((p[j] & 0xff) << 24) | ((p[j + 1] & 0xff) << 16) |
		                ((p[j + 2] & 0xff) << 8) | (p[j + 3] & 0xff));
		        }
		        for (i = 16; i < 64; i++) {
		            u = w[i - 2];
		            t1 = (u >>> 17 | u << (32 - 17)) ^ (u >>> 19 | u << (32 - 19)) ^ (u >>> 10);
		            u = w[i - 15];
		            t2 = (u >>> 7 | u << (32 - 7)) ^ (u >>> 18 | u << (32 - 18)) ^ (u >>> 3);
		            w[i] = (t1 + w[i - 7] | 0) + (t2 + w[i - 16] | 0);
		        }
		        for (i = 0; i < 64; i++) {
		            t1 = (((((e >>> 6 | e << (32 - 6)) ^ (e >>> 11 | e << (32 - 11)) ^
		                (e >>> 25 | e << (32 - 25))) + ((e & f) ^ (~e & g))) | 0) +
		                ((h + ((K[i] + w[i]) | 0)) | 0)) | 0;
		            t2 = (((a >>> 2 | a << (32 - 2)) ^ (a >>> 13 | a << (32 - 13)) ^
		                (a >>> 22 | a << (32 - 22))) + ((a & b) ^ (a & c) ^ (b & c))) | 0;
		            h = g;
		            g = f;
		            f = e;
		            e = (d + t1) | 0;
		            d = c;
		            c = b;
		            b = a;
		            a = (t1 + t2) | 0;
		        }
		        v[0] += a;
		        v[1] += b;
		        v[2] += c;
		        v[3] += d;
		        v[4] += e;
		        v[5] += f;
		        v[6] += g;
		        v[7] += h;
		        pos += 64;
		        len -= 64;
		    }
		    return pos;
		}
		// Hash implements SHA256 hash algorithm.
		var Hash = /** @class */ (function () {
		    function Hash() {
		        this.digestLength = exports$1.digestLength;
		        this.blockSize = exports$1.blockSize;
		        // Note: Int32Array is used instead of Uint32Array for performance reasons.
		        this.state = new Int32Array(8); // hash state
		        this.temp = new Int32Array(64); // temporary state
		        this.buffer = new Uint8Array(128); // buffer for data to hash
		        this.bufferLength = 0; // number of bytes in buffer
		        this.bytesHashed = 0; // number of total bytes hashed
		        this.finished = false; // indicates whether the hash was finalized
		        this.reset();
		    }
		    // Resets hash state making it possible
		    // to re-use this instance to hash other data.
		    Hash.prototype.reset = function () {
		        this.state[0] = 0x6a09e667;
		        this.state[1] = 0xbb67ae85;
		        this.state[2] = 0x3c6ef372;
		        this.state[3] = 0xa54ff53a;
		        this.state[4] = 0x510e527f;
		        this.state[5] = 0x9b05688c;
		        this.state[6] = 0x1f83d9ab;
		        this.state[7] = 0x5be0cd19;
		        this.bufferLength = 0;
		        this.bytesHashed = 0;
		        this.finished = false;
		        return this;
		    };
		    // Cleans internal buffers and re-initializes hash state.
		    Hash.prototype.clean = function () {
		        for (var i = 0; i < this.buffer.length; i++) {
		            this.buffer[i] = 0;
		        }
		        for (var i = 0; i < this.temp.length; i++) {
		            this.temp[i] = 0;
		        }
		        this.reset();
		    };
		    // Updates hash state with the given data.
		    //
		    // Optionally, length of the data can be specified to hash
		    // fewer bytes than data.length.
		    //
		    // Throws error when trying to update already finalized hash:
		    // instance must be reset to use it again.
		    Hash.prototype.update = function (data, dataLength) {
		        if (dataLength === void 0) { dataLength = data.length; }
		        if (this.finished) {
		            throw new Error("SHA256: can't update because hash was finished.");
		        }
		        var dataPos = 0;
		        this.bytesHashed += dataLength;
		        if (this.bufferLength > 0) {
		            while (this.bufferLength < 64 && dataLength > 0) {
		                this.buffer[this.bufferLength++] = data[dataPos++];
		                dataLength--;
		            }
		            if (this.bufferLength === 64) {
		                hashBlocks(this.temp, this.state, this.buffer, 0, 64);
		                this.bufferLength = 0;
		            }
		        }
		        if (dataLength >= 64) {
		            dataPos = hashBlocks(this.temp, this.state, data, dataPos, dataLength);
		            dataLength %= 64;
		        }
		        while (dataLength > 0) {
		            this.buffer[this.bufferLength++] = data[dataPos++];
		            dataLength--;
		        }
		        return this;
		    };
		    // Finalizes hash state and puts hash into out.
		    //
		    // If hash was already finalized, puts the same value.
		    Hash.prototype.finish = function (out) {
		        if (!this.finished) {
		            var bytesHashed = this.bytesHashed;
		            var left = this.bufferLength;
		            var bitLenHi = (bytesHashed / 0x20000000) | 0;
		            var bitLenLo = bytesHashed << 3;
		            var padLength = (bytesHashed % 64 < 56) ? 64 : 128;
		            this.buffer[left] = 0x80;
		            for (var i = left + 1; i < padLength - 8; i++) {
		                this.buffer[i] = 0;
		            }
		            this.buffer[padLength - 8] = (bitLenHi >>> 24) & 0xff;
		            this.buffer[padLength - 7] = (bitLenHi >>> 16) & 0xff;
		            this.buffer[padLength - 6] = (bitLenHi >>> 8) & 0xff;
		            this.buffer[padLength - 5] = (bitLenHi >>> 0) & 0xff;
		            this.buffer[padLength - 4] = (bitLenLo >>> 24) & 0xff;
		            this.buffer[padLength - 3] = (bitLenLo >>> 16) & 0xff;
		            this.buffer[padLength - 2] = (bitLenLo >>> 8) & 0xff;
		            this.buffer[padLength - 1] = (bitLenLo >>> 0) & 0xff;
		            hashBlocks(this.temp, this.state, this.buffer, 0, padLength);
		            this.finished = true;
		        }
		        for (var i = 0; i < 8; i++) {
		            out[i * 4 + 0] = (this.state[i] >>> 24) & 0xff;
		            out[i * 4 + 1] = (this.state[i] >>> 16) & 0xff;
		            out[i * 4 + 2] = (this.state[i] >>> 8) & 0xff;
		            out[i * 4 + 3] = (this.state[i] >>> 0) & 0xff;
		        }
		        return this;
		    };
		    // Returns the final hash digest.
		    Hash.prototype.digest = function () {
		        var out = new Uint8Array(this.digestLength);
		        this.finish(out);
		        return out;
		    };
		    // Internal function for use in HMAC for optimization.
		    Hash.prototype._saveState = function (out) {
		        for (var i = 0; i < this.state.length; i++) {
		            out[i] = this.state[i];
		        }
		    };
		    // Internal function for use in HMAC for optimization.
		    Hash.prototype._restoreState = function (from, bytesHashed) {
		        for (var i = 0; i < this.state.length; i++) {
		            this.state[i] = from[i];
		        }
		        this.bytesHashed = bytesHashed;
		        this.finished = false;
		        this.bufferLength = 0;
		    };
		    return Hash;
		}());
		exports$1.Hash = Hash;
		// HMAC implements HMAC-SHA256 message authentication algorithm.
		var HMAC = /** @class */ (function () {
		    function HMAC(key) {
		        this.inner = new Hash();
		        this.outer = new Hash();
		        this.blockSize = this.inner.blockSize;
		        this.digestLength = this.inner.digestLength;
		        var pad = new Uint8Array(this.blockSize);
		        if (key.length > this.blockSize) {
		            (new Hash()).update(key).finish(pad).clean();
		        }
		        else {
		            for (var i = 0; i < key.length; i++) {
		                pad[i] = key[i];
		            }
		        }
		        for (var i = 0; i < pad.length; i++) {
		            pad[i] ^= 0x36;
		        }
		        this.inner.update(pad);
		        for (var i = 0; i < pad.length; i++) {
		            pad[i] ^= 0x36 ^ 0x5c;
		        }
		        this.outer.update(pad);
		        this.istate = new Uint32Array(8);
		        this.ostate = new Uint32Array(8);
		        this.inner._saveState(this.istate);
		        this.outer._saveState(this.ostate);
		        for (var i = 0; i < pad.length; i++) {
		            pad[i] = 0;
		        }
		    }
		    // Returns HMAC state to the state initialized with key
		    // to make it possible to run HMAC over the other data with the same
		    // key without creating a new instance.
		    HMAC.prototype.reset = function () {
		        this.inner._restoreState(this.istate, this.inner.blockSize);
		        this.outer._restoreState(this.ostate, this.outer.blockSize);
		        return this;
		    };
		    // Cleans HMAC state.
		    HMAC.prototype.clean = function () {
		        for (var i = 0; i < this.istate.length; i++) {
		            this.ostate[i] = this.istate[i] = 0;
		        }
		        this.inner.clean();
		        this.outer.clean();
		    };
		    // Updates state with provided data.
		    HMAC.prototype.update = function (data) {
		        this.inner.update(data);
		        return this;
		    };
		    // Finalizes HMAC and puts the result in out.
		    HMAC.prototype.finish = function (out) {
		        if (this.outer.finished) {
		            this.outer.finish(out);
		        }
		        else {
		            this.inner.finish(out);
		            this.outer.update(out, this.digestLength).finish(out);
		        }
		        return this;
		    };
		    // Returns message authentication code.
		    HMAC.prototype.digest = function () {
		        var out = new Uint8Array(this.digestLength);
		        this.finish(out);
		        return out;
		    };
		    return HMAC;
		}());
		exports$1.HMAC = HMAC;
		// Returns SHA256 hash of data.
		function hash(data) {
		    var h = (new Hash()).update(data);
		    var digest = h.digest();
		    h.clean();
		    return digest;
		}
		exports$1.hash = hash;
		// Function hash is both available as module.hash and as default export.
		exports$1["default"] = hash;
		// Returns HMAC-SHA256 of data under the key.
		function hmac(key, data) {
		    var h = (new HMAC(key)).update(data);
		    var digest = h.digest();
		    h.clean();
		    return digest;
		}
		exports$1.hmac = hmac;
		// Fills hkdf buffer like this:
		// T(1) = HMAC-Hash(PRK, T(0) | info | 0x01)
		function fillBuffer(buffer, hmac, info, counter) {
		    // Counter is a byte value: check if it overflowed.
		    var num = counter[0];
		    if (num === 0) {
		        throw new Error("hkdf: cannot expand more");
		    }
		    // Prepare HMAC instance for new data with old key.
		    hmac.reset();
		    // Hash in previous output if it was generated
		    // (i.e. counter is greater than 1).
		    if (num > 1) {
		        hmac.update(buffer);
		    }
		    // Hash in info if it exists.
		    if (info) {
		        hmac.update(info);
		    }
		    // Hash in the counter.
		    hmac.update(counter);
		    // Output result to buffer and clean HMAC instance.
		    hmac.finish(buffer);
		    // Increment counter inside typed array, this works properly.
		    counter[0]++;
		}
		var hkdfSalt = new Uint8Array(exports$1.digestLength); // Filled with zeroes.
		function hkdf(key, salt, info, length) {
		    if (salt === void 0) { salt = hkdfSalt; }
		    if (length === void 0) { length = 32; }
		    var counter = new Uint8Array([1]);
		    // HKDF-Extract uses salt as HMAC key, and key as data.
		    var okm = hmac(salt, key);
		    // Initialize HMAC for expanding with extracted key.
		    // Ensure no collisions with `hmac` function.
		    var hmac_ = new HMAC(okm);
		    // Allocate buffer.
		    var buffer = new Uint8Array(hmac_.digestLength);
		    var bufpos = buffer.length;
		    var out = new Uint8Array(length);
		    for (var i = 0; i < length; i++) {
		        if (bufpos === buffer.length) {
		            fillBuffer(buffer, hmac_, info, counter);
		            bufpos = 0;
		        }
		        out[i] = buffer[bufpos++];
		    }
		    hmac_.clean();
		    buffer.fill(0);
		    counter.fill(0);
		    return out;
		}
		exports$1.hkdf = hkdf;
		// Derives a key from password and salt using PBKDF2-HMAC-SHA256
		// with the given number of iterations.
		//
		// The number of bytes returned is equal to dkLen.
		//
		// (For better security, avoid dkLen greater than hash length - 32 bytes).
		function pbkdf2(password, salt, iterations, dkLen) {
		    var prf = new HMAC(password);
		    var len = prf.digestLength;
		    var ctr = new Uint8Array(4);
		    var t = new Uint8Array(len);
		    var u = new Uint8Array(len);
		    var dk = new Uint8Array(dkLen);
		    for (var i = 0; i * len < dkLen; i++) {
		        var c = i + 1;
		        ctr[0] = (c >>> 24) & 0xff;
		        ctr[1] = (c >>> 16) & 0xff;
		        ctr[2] = (c >>> 8) & 0xff;
		        ctr[3] = (c >>> 0) & 0xff;
		        prf.reset();
		        prf.update(salt);
		        prf.update(ctr);
		        prf.finish(u);
		        for (var j = 0; j < len; j++) {
		            t[j] = u[j];
		        }
		        for (var j = 2; j <= iterations; j++) {
		            prf.reset();
		            prf.update(u).finish(u);
		            for (var k = 0; k < len; k++) {
		                t[k] ^= u[k];
		            }
		        }
		        for (var j = 0; j < len && i * len + j < dkLen; j++) {
		            dk[i * len + j] = t[j];
		        }
		    }
		    for (var i = 0; i < len; i++) {
		        t[i] = u[i] = 0;
		    }
		    for (var i = 0; i < 4; i++) {
		        ctr[i] = 0;
		    }
		    prf.clean();
		    return dk;
		}
		exports$1.pbkdf2 = pbkdf2;
		}); 
	} (sha256$1));
	return sha256$1.exports;
}

var hasRequiredDist$1;

function requireDist$1 () {
	if (hasRequiredDist$1) return dist;
	hasRequiredDist$1 = 1;
	Object.defineProperty(dist, "__esModule", { value: true });
	dist.Webhook = dist.WebhookVerificationError = void 0;
	const timing_safe_equal_1 = requireTiming_safe_equal();
	const base64 = requireBase64();
	const sha256 = requireSha256();
	const WEBHOOK_TOLERANCE_IN_SECONDS = 5 * 60;
	class ExtendableError extends Error {
	    constructor(message) {
	        super(message);
	        Object.setPrototypeOf(this, ExtendableError.prototype);
	        this.name = "ExtendableError";
	        this.stack = new Error(message).stack;
	    }
	}
	class WebhookVerificationError extends ExtendableError {
	    constructor(message) {
	        super(message);
	        Object.setPrototypeOf(this, WebhookVerificationError.prototype);
	        this.name = "WebhookVerificationError";
	    }
	}
	dist.WebhookVerificationError = WebhookVerificationError;
	class Webhook {
	    constructor(secret, options) {
	        if (!secret) {
	            throw new Error("Secret can't be empty.");
	        }
	        if ((options === null || options === void 0 ? void 0 : options.format) === "raw") {
	            if (secret instanceof Uint8Array) {
	                this.key = secret;
	            }
	            else {
	                this.key = Uint8Array.from(secret, (c) => c.charCodeAt(0));
	            }
	        }
	        else {
	            if (typeof secret !== "string") {
	                throw new Error("Expected secret to be of type string");
	            }
	            if (secret.startsWith(Webhook.prefix)) {
	                secret = secret.substring(Webhook.prefix.length);
	            }
	            this.key = base64.decode(secret);
	        }
	    }
	    verify(payload, headers_) {
	        const headers = {};
	        for (const key of Object.keys(headers_)) {
	            headers[key.toLowerCase()] = headers_[key];
	        }
	        const msgId = headers["webhook-id"];
	        const msgSignature = headers["webhook-signature"];
	        const msgTimestamp = headers["webhook-timestamp"];
	        if (!msgSignature || !msgId || !msgTimestamp) {
	            throw new WebhookVerificationError("Missing required headers");
	        }
	        const timestamp = this.verifyTimestamp(msgTimestamp);
	        const computedSignature = this.sign(msgId, timestamp, payload);
	        const expectedSignature = computedSignature.split(",")[1];
	        const passedSignatures = msgSignature.split(" ");
	        const encoder = new globalThis.TextEncoder();
	        for (const versionedSignature of passedSignatures) {
	            const [version, signature] = versionedSignature.split(",");
	            if (version !== "v1") {
	                continue;
	            }
	            if ((0, timing_safe_equal_1.timingSafeEqual)(encoder.encode(signature), encoder.encode(expectedSignature))) {
	                return JSON.parse(payload.toString());
	            }
	        }
	        throw new WebhookVerificationError("No matching signature found");
	    }
	    sign(msgId, timestamp, payload) {
	        if (typeof payload === "string") ;
	        else if (payload.constructor.name === "Buffer") {
	            payload = payload.toString();
	        }
	        else {
	            throw new Error("Expected payload to be of type string or Buffer.");
	        }
	        const encoder = new TextEncoder();
	        const timestampNumber = Math.floor(timestamp.getTime() / 1000);
	        const toSign = encoder.encode(`${msgId}.${timestampNumber}.${payload}`);
	        const expectedSignature = base64.encode(sha256.hmac(this.key, toSign));
	        return `v1,${expectedSignature}`;
	    }
	    verifyTimestamp(timestampHeader) {
	        const now = Math.floor(Date.now() / 1000);
	        const timestamp = parseInt(timestampHeader, 10);
	        if (isNaN(timestamp)) {
	            throw new WebhookVerificationError("Invalid Signature Headers");
	        }
	        if (now - timestamp > WEBHOOK_TOLERANCE_IN_SECONDS) {
	            throw new WebhookVerificationError("Message timestamp too old");
	        }
	        if (timestamp > now + WEBHOOK_TOLERANCE_IN_SECONDS) {
	            throw new WebhookVerificationError("Message timestamp too new");
	        }
	        return new Date(timestamp * 1000);
	    }
	}
	dist.Webhook = Webhook;
	Webhook.prefix = "whsec_";
	
	return dist;
}

var hasRequiredWebhook;

function requireWebhook () {
	if (hasRequiredWebhook) return webhook;
	hasRequiredWebhook = 1;
	(function (exports$1) {
		Object.defineProperty(exports$1, "__esModule", { value: true });
		exports$1.Webhook = exports$1.WebhookVerificationError = void 0;
		const standardwebhooks_1 = requireDist$1();
		var standardwebhooks_2 = requireDist$1();
		Object.defineProperty(exports$1, "WebhookVerificationError", { enumerable: true, get: function () { return standardwebhooks_2.WebhookVerificationError; } });
		class Webhook {
		    constructor(secret, options) {
		        this.inner = new standardwebhooks_1.Webhook(secret, options);
		    }
		    verify(payload, headers_) {
		        var _a, _b, _c, _d, _e, _f;
		        const headers = {};
		        for (const key of Object.keys(headers_)) {
		            headers[key.toLowerCase()] = headers_[key];
		        }
		        headers["webhook-id"] = (_b = (_a = headers["svix-id"]) !== null && _a !== void 0 ? _a : headers["webhook-id"]) !== null && _b !== void 0 ? _b : "";
		        headers["webhook-signature"] =
		            (_d = (_c = headers["svix-signature"]) !== null && _c !== void 0 ? _c : headers["webhook-signature"]) !== null && _d !== void 0 ? _d : "";
		        headers["webhook-timestamp"] =
		            (_f = (_e = headers["svix-timestamp"]) !== null && _e !== void 0 ? _e : headers["webhook-timestamp"]) !== null && _f !== void 0 ? _f : "";
		        return this.inner.verify(payload, headers);
		    }
		    sign(msgId, timestamp, payload) {
		        return this.inner.sign(msgId, timestamp, payload);
		    }
		}
		exports$1.Webhook = Webhook;
		
	} (webhook));
	return webhook;
}

var models = {};

var endpointDisabledTrigger = {};

var hasRequiredEndpointDisabledTrigger;

function requireEndpointDisabledTrigger () {
	if (hasRequiredEndpointDisabledTrigger) return endpointDisabledTrigger;
	hasRequiredEndpointDisabledTrigger = 1;
	(function (exports$1) {
		Object.defineProperty(exports$1, "__esModule", { value: true });
		exports$1.EndpointDisabledTriggerSerializer = exports$1.EndpointDisabledTrigger = void 0;
		(function (EndpointDisabledTrigger) {
		    EndpointDisabledTrigger["Manual"] = "manual";
		    EndpointDisabledTrigger["Automatic"] = "automatic";
		})(exports$1.EndpointDisabledTrigger || (exports$1.EndpointDisabledTrigger = {}));
		exports$1.EndpointDisabledTriggerSerializer = {
		    _fromJsonObject(object) {
		        return object;
		    },
		    _toJsonObject(self) {
		        return self;
		    },
		};
		
	} (endpointDisabledTrigger));
	return endpointDisabledTrigger;
}

var ordering = {};

var hasRequiredOrdering;

function requireOrdering () {
	if (hasRequiredOrdering) return ordering;
	hasRequiredOrdering = 1;
	(function (exports$1) {
		Object.defineProperty(exports$1, "__esModule", { value: true });
		exports$1.OrderingSerializer = exports$1.Ordering = void 0;
		(function (Ordering) {
		    Ordering["Ascending"] = "ascending";
		    Ordering["Descending"] = "descending";
		})(exports$1.Ordering || (exports$1.Ordering = {}));
		exports$1.OrderingSerializer = {
		    _fromJsonObject(object) {
		        return object;
		    },
		    _toJsonObject(self) {
		        return self;
		    },
		};
		
	} (ordering));
	return ordering;
}

var hasRequiredModels;

function requireModels () {
	if (hasRequiredModels) return models;
	hasRequiredModels = 1;
	(function (exports$1) {
		Object.defineProperty(exports$1, "__esModule", { value: true });
		exports$1.StatusCodeClass = exports$1.SinkStatusIn = exports$1.SinkStatus = exports$1.Ordering = exports$1.MessageStatusText = exports$1.MessageStatus = exports$1.MessageAttemptTriggerType = exports$1.EndpointDisabledTrigger = exports$1.ConnectorProduct = exports$1.ConnectorKind = exports$1.BackgroundTaskType = exports$1.BackgroundTaskStatus = exports$1.AppPortalCapability = void 0;
		var appPortalCapability_1 = requireAppPortalCapability();
		Object.defineProperty(exports$1, "AppPortalCapability", { enumerable: true, get: function () { return appPortalCapability_1.AppPortalCapability; } });
		var backgroundTaskStatus_1 = requireBackgroundTaskStatus();
		Object.defineProperty(exports$1, "BackgroundTaskStatus", { enumerable: true, get: function () { return backgroundTaskStatus_1.BackgroundTaskStatus; } });
		var backgroundTaskType_1 = requireBackgroundTaskType();
		Object.defineProperty(exports$1, "BackgroundTaskType", { enumerable: true, get: function () { return backgroundTaskType_1.BackgroundTaskType; } });
		var connectorKind_1 = requireConnectorKind();
		Object.defineProperty(exports$1, "ConnectorKind", { enumerable: true, get: function () { return connectorKind_1.ConnectorKind; } });
		var connectorProduct_1 = requireConnectorProduct();
		Object.defineProperty(exports$1, "ConnectorProduct", { enumerable: true, get: function () { return connectorProduct_1.ConnectorProduct; } });
		var endpointDisabledTrigger_1 = requireEndpointDisabledTrigger();
		Object.defineProperty(exports$1, "EndpointDisabledTrigger", { enumerable: true, get: function () { return endpointDisabledTrigger_1.EndpointDisabledTrigger; } });
		var messageAttemptTriggerType_1 = requireMessageAttemptTriggerType();
		Object.defineProperty(exports$1, "MessageAttemptTriggerType", { enumerable: true, get: function () { return messageAttemptTriggerType_1.MessageAttemptTriggerType; } });
		var messageStatus_1 = requireMessageStatus();
		Object.defineProperty(exports$1, "MessageStatus", { enumerable: true, get: function () { return messageStatus_1.MessageStatus; } });
		var messageStatusText_1 = requireMessageStatusText();
		Object.defineProperty(exports$1, "MessageStatusText", { enumerable: true, get: function () { return messageStatusText_1.MessageStatusText; } });
		var ordering_1 = requireOrdering();
		Object.defineProperty(exports$1, "Ordering", { enumerable: true, get: function () { return ordering_1.Ordering; } });
		var sinkStatus_1 = requireSinkStatus();
		Object.defineProperty(exports$1, "SinkStatus", { enumerable: true, get: function () { return sinkStatus_1.SinkStatus; } });
		var sinkStatusIn_1 = requireSinkStatusIn();
		Object.defineProperty(exports$1, "SinkStatusIn", { enumerable: true, get: function () { return sinkStatusIn_1.SinkStatusIn; } });
		var statusCodeClass_1 = requireStatusCodeClass();
		Object.defineProperty(exports$1, "StatusCodeClass", { enumerable: true, get: function () { return statusCodeClass_1.StatusCodeClass; } });
		
	} (models));
	return models;
}

var hasRequiredDist;

function requireDist () {
	if (hasRequiredDist) return dist$1;
	hasRequiredDist = 1;
	(function (exports$1) {
		var __createBinding = (dist$1 && dist$1.__createBinding) || (Object.create ? (function(o, m, k, k2) {
		    if (k2 === undefined) k2 = k;
		    var desc = Object.getOwnPropertyDescriptor(m, k);
		    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
		      desc = { enumerable: true, get: function() { return m[k]; } };
		    }
		    Object.defineProperty(o, k2, desc);
		}) : (function(o, m, k, k2) {
		    if (k2 === undefined) k2 = k;
		    o[k2] = m[k];
		}));
		var __exportStar = (dist$1 && dist$1.__exportStar) || function(m, exports$1) {
		    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports$1, p)) __createBinding(exports$1, m, p);
		};
		Object.defineProperty(exports$1, "__esModule", { value: true });
		exports$1.Svix = exports$1.messageInRaw = exports$1.ValidationError = exports$1.HttpErrorOut = exports$1.HTTPValidationError = exports$1.ApiException = void 0;
		const application_1 = requireApplication();
		const authentication_1 = requireAuthentication();
		const backgroundTask_1 = requireBackgroundTask();
		const connector_1 = requireConnector();
		const endpoint_1 = requireEndpoint();
		const environment_1 = requireEnvironment();
		const eventType_1 = requireEventType();
		const health_1 = requireHealth();
		const ingest_1 = requireIngest();
		const integration_1 = requireIntegration();
		const message_1 = requireMessage();
		const messageAttempt_1 = requireMessageAttempt();
		const operationalWebhook_1 = requireOperationalWebhook();
		const statistics_1 = requireStatistics();
		const streaming_1 = requireStreaming();
		const operationalWebhookEndpoint_1 = requireOperationalWebhookEndpoint();
		var util_1 = requireUtil();
		Object.defineProperty(exports$1, "ApiException", { enumerable: true, get: function () { return util_1.ApiException; } });
		var HttpErrors_1 = requireHttpErrors();
		Object.defineProperty(exports$1, "HTTPValidationError", { enumerable: true, get: function () { return HttpErrors_1.HTTPValidationError; } });
		Object.defineProperty(exports$1, "HttpErrorOut", { enumerable: true, get: function () { return HttpErrors_1.HttpErrorOut; } });
		Object.defineProperty(exports$1, "ValidationError", { enumerable: true, get: function () { return HttpErrors_1.ValidationError; } });
		__exportStar(requireWebhook(), exports$1);
		__exportStar(requireModels(), exports$1);
		var message_2 = requireMessage();
		Object.defineProperty(exports$1, "messageInRaw", { enumerable: true, get: function () { return message_2.messageInRaw; } });
		const REGIONS = [
		    { region: "us", url: "https://api.us.svix.com" },
		    { region: "eu", url: "https://api.eu.svix.com" },
		    { region: "in", url: "https://api.in.svix.com" },
		    { region: "ca", url: "https://api.ca.svix.com" },
		    { region: "au", url: "https://api.au.svix.com" },
		];
		class Svix {
		    constructor(token, options = {}) {
		        var _a, _b, _c;
		        const regionalUrl = (_a = REGIONS.find((x) => x.region === token.split(".")[1])) === null || _a === void 0 ? void 0 : _a.url;
		        const baseUrl = (_c = (_b = options.serverUrl) !== null && _b !== void 0 ? _b : regionalUrl) !== null && _c !== void 0 ? _c : "https://api.svix.com";
		        if (options.retryScheduleInMs) {
		            this.requestCtx = {
		                baseUrl,
		                token,
		                timeout: options.requestTimeout,
		                retryScheduleInMs: options.retryScheduleInMs,
		                fetch: options.fetch,
		            };
		            return;
		        }
		        if (options.numRetries) {
		            this.requestCtx = {
		                baseUrl,
		                token,
		                timeout: options.requestTimeout,
		                numRetries: options.numRetries,
		                fetch: options.fetch,
		            };
		            return;
		        }
		        this.requestCtx = {
		            baseUrl,
		            token,
		            timeout: options.requestTimeout,
		            fetch: options.fetch,
		        };
		    }
		    get application() {
		        return new application_1.Application(this.requestCtx);
		    }
		    get authentication() {
		        return new authentication_1.Authentication(this.requestCtx);
		    }
		    get backgroundTask() {
		        return new backgroundTask_1.BackgroundTask(this.requestCtx);
		    }
		    get connector() {
		        return new connector_1.Connector(this.requestCtx);
		    }
		    get endpoint() {
		        return new endpoint_1.Endpoint(this.requestCtx);
		    }
		    get environment() {
		        return new environment_1.Environment(this.requestCtx);
		    }
		    get eventType() {
		        return new eventType_1.EventType(this.requestCtx);
		    }
		    get health() {
		        return new health_1.Health(this.requestCtx);
		    }
		    get ingest() {
		        return new ingest_1.Ingest(this.requestCtx);
		    }
		    get integration() {
		        return new integration_1.Integration(this.requestCtx);
		    }
		    get message() {
		        return new message_1.Message(this.requestCtx);
		    }
		    get messageAttempt() {
		        return new messageAttempt_1.MessageAttempt(this.requestCtx);
		    }
		    get operationalWebhook() {
		        return new operationalWebhook_1.OperationalWebhook(this.requestCtx);
		    }
		    get statistics() {
		        return new statistics_1.Statistics(this.requestCtx);
		    }
		    get streaming() {
		        return new streaming_1.Streaming(this.requestCtx);
		    }
		    get operationalWebhookEndpoint() {
		        return new operationalWebhookEndpoint_1.OperationalWebhookEndpoint(this.requestCtx);
		    }
		}
		exports$1.Svix = Svix;
		
	} (dist$1));
	return dist$1;
}

var distExports = requireDist();

var version = "6.12.2";
function buildPaginationQuery(options) {
  const searchParams = new URLSearchParams();
  if (options.limit !== void 0) searchParams.set("limit", options.limit.toString());
  if ("after" in options && options.after !== void 0) searchParams.set("after", options.after);
  if ("before" in options && options.before !== void 0) searchParams.set("before", options.before);
  return searchParams.toString();
}
var ApiKeys = class {
  constructor(resend) {
    this.resend = resend;
  }
  async create(payload, options = {}) {
    return await this.resend.post("/api-keys", payload, options);
  }
  async list(options = {}) {
    const queryString = buildPaginationQuery(options);
    const url = queryString ? `/api-keys?${queryString}` : "/api-keys";
    return await this.resend.get(url);
  }
  async remove(id) {
    return await this.resend.delete(`/api-keys/${id}`);
  }
};
var AutomationRuns = class {
  constructor(resend) {
    this.resend = resend;
  }
  async get(options) {
    return await this.resend.get(`/automations/${options.automationId}/runs/${options.runId}`);
  }
  async list(options) {
    const queryString = buildPaginationQuery(options);
    const searchParams = new URLSearchParams(queryString);
    if (options.status) {
      const statusValue = Array.isArray(options.status) ? options.status.join(",") : options.status;
      searchParams.set("status", statusValue);
    }
    const qs = searchParams.toString();
    const url = qs ? `/automations/${options.automationId}/runs?${qs}` : `/automations/${options.automationId}/runs`;
    return await this.resend.get(url);
  }
};
function parseStepConfig(step) {
  switch (step.type) {
    case "trigger":
      return {
        key: step.key,
        type: step.type,
        config: { event_name: step.config.eventName }
      };
    case "delay":
      return {
        key: step.key,
        type: step.type,
        config: step.config
      };
    case "send_email":
      return {
        key: step.key,
        type: step.type,
        config: {
          template: step.config.template,
          subject: step.config.subject,
          from: step.config.from,
          reply_to: step.config.replyTo
        }
      };
    case "wait_for_event":
      return {
        key: step.key,
        type: step.type,
        config: {
          event_name: step.config.eventName,
          timeout: step.config.timeout,
          filter_rule: step.config.filterRule
        }
      };
    case "condition":
      return {
        key: step.key,
        type: step.type,
        config: step.config
      };
    case "contact_update":
      return {
        key: step.key,
        type: step.type,
        config: {
          first_name: step.config.firstName,
          last_name: step.config.lastName,
          unsubscribed: step.config.unsubscribed,
          properties: step.config.properties
        }
      };
    case "contact_delete":
      return {
        key: step.key,
        type: step.type,
        config: step.config
      };
    case "add_to_segment":
      return {
        key: step.key,
        type: step.type,
        config: { segment_id: step.config.segmentId }
      };
  }
}
function parseConnection(connection) {
  return {
    from: connection.from,
    to: connection.to,
    type: connection.type
  };
}
function parseAutomationToApiOptions(automation) {
  return {
    name: automation.name,
    status: automation.status,
    steps: automation.steps.map(parseStepConfig),
    connections: automation.connections.map(parseConnection)
  };
}
function parseEventToApiOptions(event) {
  return {
    event: event.event,
    contact_id: event.contactId,
    email: event.email,
    payload: event.payload
  };
}
var Automations = class {
  constructor(resend) {
    this.resend = resend;
    this.runs = new AutomationRuns(this.resend);
  }
  async create(payload) {
    return await this.resend.post("/automations", parseAutomationToApiOptions(payload));
  }
  async list(options = {}) {
    const params = [buildPaginationQuery(options)];
    if (options.status) params.push(`status=${encodeURIComponent(options.status)}`);
    const qs = params.filter(Boolean).join("&");
    const url = qs ? `/automations?${qs}` : "/automations";
    return await this.resend.get(url);
  }
  async get(id) {
    return await this.resend.get(`/automations/${id}`);
  }
  async remove(id) {
    return await this.resend.delete(`/automations/${id}`);
  }
  async update(id, payload) {
    const apiPayload = {};
    if (payload.name !== void 0) apiPayload.name = payload.name;
    if (payload.status !== void 0) apiPayload.status = payload.status;
    if (payload.steps !== void 0) apiPayload.steps = payload.steps.map(parseStepConfig);
    if (payload.connections !== void 0) apiPayload.connections = payload.connections.map(parseConnection);
    return await this.resend.patch(`/automations/${id}`, apiPayload);
  }
  async stop(id) {
    return await this.resend.post(`/automations/${id}/stop`);
  }
};
function parseAttachments(attachments) {
  return attachments?.map((attachment) => ({
    content: attachment.content,
    filename: attachment.filename,
    path: attachment.path,
    content_type: attachment.contentType,
    content_id: attachment.contentId
  }));
}
function parseEmailToApiOptions(email) {
  return {
    attachments: parseAttachments(email.attachments),
    bcc: email.bcc,
    cc: email.cc,
    from: email.from,
    headers: email.headers,
    html: email.html,
    reply_to: email.replyTo,
    scheduled_at: email.scheduledAt,
    subject: email.subject,
    tags: email.tags,
    text: email.text,
    to: email.to,
    template: email.template ? {
      id: email.template.id,
      variables: email.template.variables
    } : void 0,
    topic_id: email.topicId
  };
}
async function render(node) {
  let render2;
  try {
    ({ render: render2 } = await import('./render_resend_DLE_5PtG.mjs'));
  } catch {
    throw new Error("Failed to render React component. Make sure to install `@react-email/render` or `@react-email/components`.");
  }
  return render2(node);
}
var Batch = class {
  constructor(resend) {
    this.resend = resend;
  }
  async send(payload, options) {
    return this.create(payload, options);
  }
  async create(payload, options) {
    const emails = [];
    for (const email of payload) {
      if (email.react) {
        email.html = await render(email.react);
        email.react = void 0;
      }
      emails.push(parseEmailToApiOptions(email));
    }
    return await this.resend.post("/emails/batch", emails, {
      ...options,
      headers: {
        "x-batch-validation": options?.batchValidation ?? "strict",
        ...options?.headers
      }
    });
  }
};
var Broadcasts = class {
  constructor(resend) {
    this.resend = resend;
  }
  async create(payload, options = {}) {
    if (payload.react) payload.html = await render(payload.react);
    return await this.resend.post("/broadcasts", {
      name: payload.name,
      segment_id: payload.segmentId,
      audience_id: payload.audienceId,
      preview_text: payload.previewText,
      from: payload.from,
      html: payload.html,
      reply_to: payload.replyTo,
      subject: payload.subject,
      text: payload.text,
      topic_id: payload.topicId,
      send: payload.send,
      scheduled_at: payload.scheduledAt
    }, options);
  }
  async send(id, payload) {
    return await this.resend.post(`/broadcasts/${id}/send`, { scheduled_at: payload?.scheduledAt });
  }
  async list(options = {}) {
    const queryString = buildPaginationQuery(options);
    const url = queryString ? `/broadcasts?${queryString}` : "/broadcasts";
    return await this.resend.get(url);
  }
  async get(id) {
    return await this.resend.get(`/broadcasts/${id}`);
  }
  async remove(id) {
    return await this.resend.delete(`/broadcasts/${id}`);
  }
  async update(id, payload) {
    if (payload.react) payload.html = await render(payload.react);
    return await this.resend.patch(`/broadcasts/${id}`, {
      name: payload.name,
      segment_id: payload.segmentId,
      audience_id: payload.audienceId,
      from: payload.from,
      html: payload.html,
      text: payload.text,
      subject: payload.subject,
      reply_to: payload.replyTo,
      preview_text: payload.previewText,
      topic_id: payload.topicId
    });
  }
};
function parseContactPropertyFromApi(contactProperty) {
  return {
    id: contactProperty.id,
    key: contactProperty.key,
    createdAt: contactProperty.created_at,
    type: contactProperty.type,
    fallbackValue: contactProperty.fallback_value
  };
}
function parseContactPropertyToApiOptions(contactProperty) {
  if ("key" in contactProperty) return {
    key: contactProperty.key,
    type: contactProperty.type,
    fallback_value: contactProperty.fallbackValue
  };
  return { fallback_value: contactProperty.fallbackValue };
}
var ContactProperties = class {
  constructor(resend) {
    this.resend = resend;
  }
  async create(options) {
    const apiOptions = parseContactPropertyToApiOptions(options);
    return await this.resend.post("/contact-properties", apiOptions);
  }
  async list(options = {}) {
    const queryString = buildPaginationQuery(options);
    const url = queryString ? `/contact-properties?${queryString}` : "/contact-properties";
    const response = await this.resend.get(url);
    if (response.data) return {
      data: {
        ...response.data,
        data: response.data.data.map((apiContactProperty) => parseContactPropertyFromApi(apiContactProperty))
      },
      headers: response.headers,
      error: null
    };
    return response;
  }
  async get(id) {
    if (!id) return {
      data: null,
      headers: null,
      error: {
        message: "Missing `id` field.",
        statusCode: null,
        name: "missing_required_field"
      }
    };
    const response = await this.resend.get(`/contact-properties/${id}`);
    if (response.data) return {
      data: {
        object: "contact_property",
        ...parseContactPropertyFromApi(response.data)
      },
      headers: response.headers,
      error: null
    };
    return response;
  }
  async update(payload) {
    if (!payload.id) return {
      data: null,
      headers: null,
      error: {
        message: "Missing `id` field.",
        statusCode: null,
        name: "missing_required_field"
      }
    };
    const apiOptions = parseContactPropertyToApiOptions(payload);
    return await this.resend.patch(`/contact-properties/${payload.id}`, apiOptions);
  }
  async remove(id) {
    if (!id) return {
      data: null,
      headers: null,
      error: {
        message: "Missing `id` field.",
        statusCode: null,
        name: "missing_required_field"
      }
    };
    return await this.resend.delete(`/contact-properties/${id}`);
  }
};
var ContactSegments = class {
  constructor(resend) {
    this.resend = resend;
  }
  async list(options) {
    if (!options.contactId && !options.email) return {
      data: null,
      headers: null,
      error: {
        message: "Missing `id` or `email` field.",
        statusCode: null,
        name: "missing_required_field"
      }
    };
    const identifier = options.email ? options.email : options.contactId;
    const queryString = buildPaginationQuery(options);
    const url = queryString ? `/contacts/${identifier}/segments?${queryString}` : `/contacts/${identifier}/segments`;
    return await this.resend.get(url);
  }
  async add(options) {
    if (!options.contactId && !options.email) return {
      data: null,
      headers: null,
      error: {
        message: "Missing `id` or `email` field.",
        statusCode: null,
        name: "missing_required_field"
      }
    };
    const identifier = options.email ? options.email : options.contactId;
    return this.resend.post(`/contacts/${identifier}/segments/${options.segmentId}`);
  }
  async remove(options) {
    if (!options.contactId && !options.email) return {
      data: null,
      headers: null,
      error: {
        message: "Missing `id` or `email` field.",
        statusCode: null,
        name: "missing_required_field"
      }
    };
    const identifier = options.email ? options.email : options.contactId;
    return this.resend.delete(`/contacts/${identifier}/segments/${options.segmentId}`);
  }
};
var ContactTopics = class {
  constructor(resend) {
    this.resend = resend;
  }
  async update(payload) {
    if (!payload.id && !payload.email) return {
      data: null,
      headers: null,
      error: {
        message: "Missing `id` or `email` field.",
        statusCode: null,
        name: "missing_required_field"
      }
    };
    const identifier = payload.email ? payload.email : payload.id;
    return this.resend.patch(`/contacts/${identifier}/topics`, payload.topics);
  }
  async list(options) {
    if (!options.id && !options.email) return {
      data: null,
      headers: null,
      error: {
        message: "Missing `id` or `email` field.",
        statusCode: null,
        name: "missing_required_field"
      }
    };
    const identifier = options.email ? options.email : options.id;
    const queryString = buildPaginationQuery(options);
    const url = queryString ? `/contacts/${identifier}/topics?${queryString}` : `/contacts/${identifier}/topics`;
    return this.resend.get(url);
  }
};
var Contacts = class {
  constructor(resend) {
    this.resend = resend;
    this.topics = new ContactTopics(this.resend);
    this.segments = new ContactSegments(this.resend);
  }
  async create(payload, options = {}) {
    if ("audienceId" in payload) {
      if ("segments" in payload || "topics" in payload) return {
        data: null,
        headers: null,
        error: {
          message: "`audienceId` is deprecated, and cannot be used together with `segments` or `topics`. Use `segments` instead to add one or more segments to the new contact.",
          statusCode: null,
          name: "invalid_parameter"
        }
      };
      return await this.resend.post(`/audiences/${payload.audienceId}/contacts`, {
        unsubscribed: payload.unsubscribed,
        email: payload.email,
        first_name: payload.firstName,
        last_name: payload.lastName,
        properties: payload.properties
      }, options);
    }
    return await this.resend.post("/contacts", {
      unsubscribed: payload.unsubscribed,
      email: payload.email,
      first_name: payload.firstName,
      last_name: payload.lastName,
      properties: payload.properties,
      segments: payload.segments,
      topics: payload.topics
    }, options);
  }
  async list(options = {}) {
    const segmentId = options.segmentId ?? options.audienceId;
    if (!segmentId) {
      const queryString2 = buildPaginationQuery(options);
      const url2 = queryString2 ? `/contacts?${queryString2}` : "/contacts";
      return await this.resend.get(url2);
    }
    const queryString = buildPaginationQuery(options);
    const url = queryString ? `/segments/${segmentId}/contacts?${queryString}` : `/segments/${segmentId}/contacts`;
    return await this.resend.get(url);
  }
  async get(options) {
    if (typeof options === "string") return this.resend.get(`/contacts/${options}`);
    if (!options.id && !options.email) return {
      data: null,
      headers: null,
      error: {
        message: "Missing `id` or `email` field.",
        statusCode: null,
        name: "missing_required_field"
      }
    };
    if (!options.audienceId) return this.resend.get(`/contacts/${options?.email ? options?.email : options?.id}`);
    return this.resend.get(`/audiences/${options.audienceId}/contacts/${options?.email ? options?.email : options?.id}`);
  }
  async update(options) {
    if (!options.id && !options.email) return {
      data: null,
      headers: null,
      error: {
        message: "Missing `id` or `email` field.",
        statusCode: null,
        name: "missing_required_field"
      }
    };
    if (!options.audienceId) return await this.resend.patch(`/contacts/${options?.email ? options?.email : options?.id}`, {
      unsubscribed: options.unsubscribed,
      first_name: options.firstName,
      last_name: options.lastName,
      properties: options.properties
    });
    return await this.resend.patch(`/audiences/${options.audienceId}/contacts/${options?.email ? options?.email : options?.id}`, {
      unsubscribed: options.unsubscribed,
      first_name: options.firstName,
      last_name: options.lastName,
      properties: options.properties
    });
  }
  async remove(payload) {
    if (typeof payload === "string") return this.resend.delete(`/contacts/${payload}`);
    if (!payload.id && !payload.email) return {
      data: null,
      headers: null,
      error: {
        message: "Missing `id` or `email` field.",
        statusCode: null,
        name: "missing_required_field"
      }
    };
    if (!payload.audienceId) return this.resend.delete(`/contacts/${payload?.email ? payload?.email : payload?.id}`);
    return this.resend.delete(`/audiences/${payload.audienceId}/contacts/${payload?.email ? payload?.email : payload?.id}`);
  }
};
function parseDomainToApiOptions(domain) {
  return {
    name: domain.name,
    region: domain.region,
    custom_return_path: domain.customReturnPath,
    capabilities: domain.capabilities,
    open_tracking: domain.openTracking,
    click_tracking: domain.clickTracking,
    tls: domain.tls,
    tracking_subdomain: domain.trackingSubdomain
  };
}
var Domains = class {
  constructor(resend) {
    this.resend = resend;
  }
  async create(payload, options = {}) {
    return await this.resend.post("/domains", parseDomainToApiOptions(payload), options);
  }
  async list(options = {}) {
    const queryString = buildPaginationQuery(options);
    const url = queryString ? `/domains?${queryString}` : "/domains";
    return await this.resend.get(url);
  }
  async get(id) {
    return await this.resend.get(`/domains/${id}`);
  }
  async update(payload) {
    return await this.resend.patch(`/domains/${payload.id}`, {
      click_tracking: payload.clickTracking,
      open_tracking: payload.openTracking,
      tls: payload.tls,
      capabilities: payload.capabilities,
      tracking_subdomain: payload.trackingSubdomain
    });
  }
  async remove(id) {
    return await this.resend.delete(`/domains/${id}`);
  }
  async verify(id) {
    return await this.resend.post(`/domains/${id}/verify`);
  }
};
var Attachments$1 = class {
  constructor(resend) {
    this.resend = resend;
  }
  async get(options) {
    const { emailId, id } = options;
    return await this.resend.get(`/emails/${emailId}/attachments/${id}`);
  }
  async list(options) {
    const { emailId } = options;
    const queryString = buildPaginationQuery(options);
    const url = queryString ? `/emails/${emailId}/attachments?${queryString}` : `/emails/${emailId}/attachments`;
    return await this.resend.get(url);
  }
};
var Attachments = class {
  constructor(resend) {
    this.resend = resend;
  }
  async get(options) {
    const { emailId, id } = options;
    return await this.resend.get(`/emails/receiving/${emailId}/attachments/${id}`);
  }
  async list(options) {
    const { emailId } = options;
    const queryString = buildPaginationQuery(options);
    const url = queryString ? `/emails/receiving/${emailId}/attachments?${queryString}` : `/emails/receiving/${emailId}/attachments`;
    return await this.resend.get(url);
  }
};
var Receiving = class {
  constructor(resend) {
    this.resend = resend;
    this.attachments = new Attachments(resend);
  }
  async get(id) {
    return await this.resend.get(`/emails/receiving/${id}`);
  }
  async list(options = {}) {
    const queryString = buildPaginationQuery(options);
    const url = queryString ? `/emails/receiving?${queryString}` : "/emails/receiving";
    return await this.resend.get(url);
  }
  async forward(options) {
    const { emailId, to, from } = options;
    const passthrough = options.passthrough !== false;
    const emailResponse = await this.get(emailId);
    if (emailResponse.error) return {
      data: null,
      error: emailResponse.error,
      headers: emailResponse.headers
    };
    const email = emailResponse.data;
    const originalSubject = email.subject || "(no subject)";
    if (passthrough) return this.forwardPassthrough(email, {
      to,
      from,
      subject: originalSubject
    });
    const forwardSubject = originalSubject.startsWith("Fwd:") ? originalSubject : `Fwd: ${originalSubject}`;
    return this.forwardWrapped(email, {
      to,
      from,
      subject: forwardSubject,
      text: "text" in options ? options.text : void 0,
      html: "html" in options ? options.html : void 0
    });
  }
  async forwardPassthrough(email, options) {
    const { to, from, subject } = options;
    if (!email.raw?.download_url) return {
      data: null,
      error: {
        name: "validation_error",
        message: "Raw email content is not available for this email",
        statusCode: 400
      },
      headers: null
    };
    const rawResponse = await fetch(email.raw.download_url);
    if (!rawResponse.ok) return {
      data: null,
      error: {
        name: "application_error",
        message: "Failed to download raw email content",
        statusCode: rawResponse.status
      },
      headers: null
    };
    const rawEmailContent = await rawResponse.text();
    const parsed = await PostalMime.parse(rawEmailContent, { attachmentEncoding: "base64" });
    const attachments = parsed.attachments.map((attachment) => {
      const contentId = attachment.contentId ? attachment.contentId.replace(/^<|>$/g, "") : void 0;
      return {
        filename: attachment.filename,
        content: attachment.content.toString(),
        content_type: attachment.mimeType,
        content_id: contentId || void 0
      };
    });
    return await this.resend.post("/emails", {
      from,
      to,
      subject,
      text: parsed.text || void 0,
      html: parsed.html || void 0,
      attachments: attachments.length > 0 ? attachments : void 0
    });
  }
  async forwardWrapped(email, options) {
    const { to, from, subject, text, html } = options;
    if (!email.raw?.download_url) return {
      data: null,
      error: {
        name: "validation_error",
        message: "Raw email content is not available for this email",
        statusCode: 400
      },
      headers: null
    };
    const rawResponse = await fetch(email.raw.download_url);
    if (!rawResponse.ok) return {
      data: null,
      error: {
        name: "application_error",
        message: "Failed to download raw email content",
        statusCode: rawResponse.status
      },
      headers: null
    };
    const rawEmailContent = await rawResponse.text();
    return await this.resend.post("/emails", {
      from,
      to,
      subject,
      text,
      html,
      attachments: [{
        filename: "forwarded_message.eml",
        content: Buffer.from(rawEmailContent).toString("base64"),
        content_type: "message/rfc822"
      }]
    });
  }
};
var Emails = class {
  constructor(resend) {
    this.resend = resend;
    this.attachments = new Attachments$1(resend);
    this.receiving = new Receiving(resend);
  }
  async send(payload, options = {}) {
    return this.create(payload, options);
  }
  async create(payload, options = {}) {
    if (payload.react) payload.html = await render(payload.react);
    return await this.resend.post("/emails", parseEmailToApiOptions(payload), options);
  }
  async get(id) {
    return await this.resend.get(`/emails/${id}`);
  }
  async list(options = {}) {
    const queryString = buildPaginationQuery(options);
    const url = queryString ? `/emails?${queryString}` : "/emails";
    return await this.resend.get(url);
  }
  async update(payload) {
    return await this.resend.patch(`/emails/${payload.id}`, { scheduled_at: payload.scheduledAt });
  }
  async cancel(id) {
    return await this.resend.post(`/emails/${id}/cancel`);
  }
};
var Events = class {
  constructor(resend) {
    this.resend = resend;
  }
  async send(payload) {
    return await this.resend.post("/events/send", parseEventToApiOptions(payload));
  }
  async create(payload) {
    return await this.resend.post("/events", payload);
  }
  async get(identifier) {
    return await this.resend.get(`/events/${encodeURIComponent(identifier)}`);
  }
  async list(options = {}) {
    const queryString = buildPaginationQuery(options);
    const url = queryString ? `/events?${queryString}` : "/events";
    return await this.resend.get(url);
  }
  async update(identifier, payload) {
    return await this.resend.patch(`/events/${encodeURIComponent(identifier)}`, payload);
  }
  async remove(identifier) {
    return await this.resend.delete(`/events/${encodeURIComponent(identifier)}`);
  }
};
var Logs = class {
  constructor(resend) {
    this.resend = resend;
  }
  async list(options = {}) {
    const queryString = buildPaginationQuery(options);
    const url = queryString ? `/logs?${queryString}` : "/logs";
    return await this.resend.get(url);
  }
  async get(id) {
    return await this.resend.get(`/logs/${id}`);
  }
};
var Segments = class {
  constructor(resend) {
    this.resend = resend;
  }
  async create(payload, options = {}) {
    return await this.resend.post("/segments", payload, options);
  }
  async list(options = {}) {
    const queryString = buildPaginationQuery(options);
    const url = queryString ? `/segments?${queryString}` : "/segments";
    return await this.resend.get(url);
  }
  async get(id) {
    return await this.resend.get(`/segments/${id}`);
  }
  async remove(id) {
    return await this.resend.delete(`/segments/${id}`);
  }
};
function getPaginationQueryProperties(options = {}) {
  const query = new URLSearchParams();
  if (options.before) query.set("before", options.before);
  if (options.after) query.set("after", options.after);
  if (options.limit) query.set("limit", options.limit.toString());
  return query.size > 0 ? `?${query.toString()}` : "";
}
function parseVariables(variables) {
  return variables?.map((variable) => ({
    key: variable.key,
    type: variable.type,
    fallback_value: variable.fallbackValue
  }));
}
function parseTemplateToApiOptions(template) {
  return {
    name: "name" in template ? template.name : void 0,
    subject: template.subject,
    html: template.html,
    text: template.text,
    alias: template.alias,
    from: template.from,
    reply_to: template.replyTo,
    variables: parseVariables(template.variables)
  };
}
var ChainableTemplateResult = class {
  constructor(promise, publishFn) {
    this.promise = promise;
    this.publishFn = publishFn;
  }
  then(onfulfilled, onrejected) {
    return this.promise.then(onfulfilled, onrejected);
  }
  async publish() {
    const { data, error } = await this.promise;
    if (error) return {
      data: null,
      headers: null,
      error
    };
    return this.publishFn(data.id);
  }
};
var Templates = class {
  constructor(resend) {
    this.resend = resend;
  }
  create(payload) {
    return new ChainableTemplateResult(this.performCreate(payload), this.publish.bind(this));
  }
  async performCreate(payload) {
    if (payload.react) {
      if (!this.renderAsync) try {
        const { renderAsync } = await import('./render_resend_DLE_5PtG.mjs');
        this.renderAsync = renderAsync;
      } catch {
        throw new Error("Failed to render React component. Make sure to install `@react-email/render`");
      }
      payload.html = await this.renderAsync(payload.react);
    }
    return this.resend.post("/templates", parseTemplateToApiOptions(payload));
  }
  async remove(identifier) {
    return await this.resend.delete(`/templates/${identifier}`);
  }
  async get(identifier) {
    return await this.resend.get(`/templates/${identifier}`);
  }
  async list(options = {}) {
    return this.resend.get(`/templates${getPaginationQueryProperties(options)}`);
  }
  duplicate(identifier) {
    return new ChainableTemplateResult(this.resend.post(`/templates/${identifier}/duplicate`), this.publish.bind(this));
  }
  async publish(identifier) {
    return await this.resend.post(`/templates/${identifier}/publish`);
  }
  async update(identifier, payload) {
    return await this.resend.patch(`/templates/${identifier}`, parseTemplateToApiOptions(payload));
  }
};
var Topics = class {
  constructor(resend) {
    this.resend = resend;
  }
  async create(payload) {
    const { defaultSubscription, ...body } = payload;
    return await this.resend.post("/topics", {
      ...body,
      default_subscription: defaultSubscription
    });
  }
  async list() {
    return await this.resend.get("/topics");
  }
  async get(id) {
    if (!id) return {
      data: null,
      headers: null,
      error: {
        message: "Missing `id` field.",
        statusCode: null,
        name: "missing_required_field"
      }
    };
    return await this.resend.get(`/topics/${id}`);
  }
  async update(payload) {
    if (!payload.id) return {
      data: null,
      headers: null,
      error: {
        message: "Missing `id` field.",
        statusCode: null,
        name: "missing_required_field"
      }
    };
    return await this.resend.patch(`/topics/${payload.id}`, payload);
  }
  async remove(id) {
    if (!id) return {
      data: null,
      headers: null,
      error: {
        message: "Missing `id` field.",
        statusCode: null,
        name: "missing_required_field"
      }
    };
    return await this.resend.delete(`/topics/${id}`);
  }
};
var Webhooks = class {
  constructor(resend) {
    this.resend = resend;
  }
  async create(payload, options = {}) {
    return await this.resend.post("/webhooks", payload, options);
  }
  async get(id) {
    return await this.resend.get(`/webhooks/${id}`);
  }
  async list(options = {}) {
    const queryString = buildPaginationQuery(options);
    const url = queryString ? `/webhooks?${queryString}` : "/webhooks";
    return await this.resend.get(url);
  }
  async update(id, payload) {
    return await this.resend.patch(`/webhooks/${id}`, payload);
  }
  async remove(id) {
    return await this.resend.delete(`/webhooks/${id}`);
  }
  verify(payload) {
    return new distExports.Webhook(payload.webhookSecret).verify(payload.payload, {
      "svix-id": payload.headers.id,
      "svix-timestamp": payload.headers.timestamp,
      "svix-signature": payload.headers.signature
    });
  }
};
const defaultBaseUrl = "https://api.resend.com";
const defaultUserAgent = `resend-node:${version}`;
const baseUrl = typeof process !== "undefined" && process.env ? process.env.RESEND_BASE_URL || defaultBaseUrl : defaultBaseUrl;
const userAgent = typeof process !== "undefined" && process.env ? process.env.RESEND_USER_AGENT || defaultUserAgent : defaultUserAgent;
var Resend = class {
  constructor(key) {
    this.key = key;
    this.segments = new Segments(this);
    this.apiKeys = new ApiKeys(this);
    this.audiences = this.segments;
    this.automations = new Automations(this);
    this.batch = new Batch(this);
    this.broadcasts = new Broadcasts(this);
    this.contactProperties = new ContactProperties(this);
    this.contacts = new Contacts(this);
    this.domains = new Domains(this);
    this.emails = new Emails(this);
    this.events = new Events(this);
    this.logs = new Logs(this);
    this.templates = new Templates(this);
    this.topics = new Topics(this);
    this.webhooks = new Webhooks(this);
    if (!key) {
      if (typeof process !== "undefined" && process.env) this.key = process.env.RESEND_API_KEY;
      if (!this.key) throw new Error('Missing API key. Pass it to the constructor `new Resend("re_123")`');
    }
    this.headers = new Headers({
      Authorization: `Bearer ${this.key}`,
      "User-Agent": userAgent,
      "Content-Type": "application/json"
    });
  }
  async fetchRequest(path, options = {}) {
    try {
      const response = await fetch(`${baseUrl}${path}`, options);
      if (!response.ok) try {
        const rawError = await response.text();
        return {
          data: null,
          error: JSON.parse(rawError),
          headers: Object.fromEntries(response.headers.entries())
        };
      } catch (err) {
        if (err instanceof SyntaxError) return {
          data: null,
          error: {
            name: "application_error",
            statusCode: response.status,
            message: "Internal server error. We are unable to process your request right now, please try again later."
          },
          headers: Object.fromEntries(response.headers.entries())
        };
        const error = {
          message: response.statusText,
          statusCode: response.status,
          name: "application_error"
        };
        if (err instanceof Error) return {
          data: null,
          error: {
            ...error,
            message: err.message
          },
          headers: Object.fromEntries(response.headers.entries())
        };
        return {
          data: null,
          error,
          headers: Object.fromEntries(response.headers.entries())
        };
      }
      return {
        data: await response.json(),
        error: null,
        headers: Object.fromEntries(response.headers.entries())
      };
    } catch {
      return {
        data: null,
        error: {
          name: "application_error",
          statusCode: null,
          message: "Unable to fetch data. The request could not be resolved."
        },
        headers: null
      };
    }
  }
  async post(path, entity, options = {}) {
    const headers = new Headers(this.headers);
    if (options.headers) for (const [key, value] of new Headers(options.headers).entries()) headers.set(key, value);
    if (options.idempotencyKey) headers.set("Idempotency-Key", options.idempotencyKey);
    const requestOptions = {
      method: "POST",
      body: JSON.stringify(entity),
      ...options,
      headers
    };
    return this.fetchRequest(path, requestOptions);
  }
  async get(path, options = {}) {
    const headers = new Headers(this.headers);
    if (options.headers) for (const [key, value] of new Headers(options.headers).entries()) headers.set(key, value);
    const requestOptions = {
      method: "GET",
      ...options,
      headers
    };
    return this.fetchRequest(path, requestOptions);
  }
  async put(path, entity, options = {}) {
    const headers = new Headers(this.headers);
    if (options.headers) for (const [key, value] of new Headers(options.headers).entries()) headers.set(key, value);
    const requestOptions = {
      method: "PUT",
      body: JSON.stringify(entity),
      ...options,
      headers
    };
    return this.fetchRequest(path, requestOptions);
  }
  async patch(path, entity, options = {}) {
    const headers = new Headers(this.headers);
    if (options.headers) for (const [key, value] of new Headers(options.headers).entries()) headers.set(key, value);
    const requestOptions = {
      method: "PATCH",
      body: JSON.stringify(entity),
      ...options,
      headers
    };
    return this.fetchRequest(path, requestOptions);
  }
  async delete(path, query) {
    const requestOptions = {
      method: "DELETE",
      body: JSON.stringify(query),
      headers: this.headers
    };
    return this.fetchRequest(path, requestOptions);
  }
};

export { Resend as R };
