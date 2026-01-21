import { createRequire as topLevelCreateRequire } from 'module';
const require = topLevelCreateRequire(import.meta.url);
import { fileURLToPath as topLevelFileUrlToPath, URL as topLevelURL } from "url"
const __filename = topLevelFileUrlToPath(import.meta.url)
const __dirname = topLevelFileUrlToPath(new topLevelURL(".", import.meta.url))

var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __require = /* @__PURE__ */ ((x2) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x2, {
  get: (a, b2) => (typeof require !== "undefined" ? require : a)[b2]
}) : x2)(function(x2) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x2 + '" is not supported');
});
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require2() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except2, desc2) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except2)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc2 = __getOwnPropDesc(from, key)) || desc2.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/.pnpm/ws@8.19.0/node_modules/ws/lib/constants.js
var require_constants = __commonJS({
  "node_modules/.pnpm/ws@8.19.0/node_modules/ws/lib/constants.js"(exports, module) {
    "use strict";
    var BINARY_TYPES = ["nodebuffer", "arraybuffer", "fragments"];
    var hasBlob = typeof Blob !== "undefined";
    if (hasBlob) BINARY_TYPES.push("blob");
    module.exports = {
      BINARY_TYPES,
      CLOSE_TIMEOUT: 3e4,
      EMPTY_BUFFER: Buffer.alloc(0),
      GUID: "258EAFA5-E914-47DA-95CA-C5AB0DC85B11",
      hasBlob,
      kForOnEventAttribute: Symbol("kIsForOnEventAttribute"),
      kListener: Symbol("kListener"),
      kStatusCode: Symbol("status-code"),
      kWebSocket: Symbol("websocket"),
      NOOP: /* @__PURE__ */ __name(() => {
      }, "NOOP")
    };
  }
});

// node_modules/.pnpm/ws@8.19.0/node_modules/ws/lib/buffer-util.js
var require_buffer_util = __commonJS({
  "node_modules/.pnpm/ws@8.19.0/node_modules/ws/lib/buffer-util.js"(exports, module) {
    "use strict";
    var { EMPTY_BUFFER } = require_constants();
    var FastBuffer = Buffer[Symbol.species];
    function concat2(list, totalLength) {
      if (list.length === 0) return EMPTY_BUFFER;
      if (list.length === 1) return list[0];
      const target = Buffer.allocUnsafe(totalLength);
      let offset = 0;
      for (let i = 0; i < list.length; i++) {
        const buf = list[i];
        target.set(buf, offset);
        offset += buf.length;
      }
      if (offset < totalLength) {
        return new FastBuffer(target.buffer, target.byteOffset, offset);
      }
      return target;
    }
    __name(concat2, "concat");
    function _mask(source, mask, output, offset, length) {
      for (let i = 0; i < length; i++) {
        output[offset + i] = source[i] ^ mask[i & 3];
      }
    }
    __name(_mask, "_mask");
    function _unmask(buffer, mask) {
      for (let i = 0; i < buffer.length; i++) {
        buffer[i] ^= mask[i & 3];
      }
    }
    __name(_unmask, "_unmask");
    function toArrayBuffer(buf) {
      if (buf.length === buf.buffer.byteLength) {
        return buf.buffer;
      }
      return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.length);
    }
    __name(toArrayBuffer, "toArrayBuffer");
    function toBuffer(data) {
      toBuffer.readOnly = true;
      if (Buffer.isBuffer(data)) return data;
      let buf;
      if (data instanceof ArrayBuffer) {
        buf = new FastBuffer(data);
      } else if (ArrayBuffer.isView(data)) {
        buf = new FastBuffer(data.buffer, data.byteOffset, data.byteLength);
      } else {
        buf = Buffer.from(data);
        toBuffer.readOnly = false;
      }
      return buf;
    }
    __name(toBuffer, "toBuffer");
    module.exports = {
      concat: concat2,
      mask: _mask,
      toArrayBuffer,
      toBuffer,
      unmask: _unmask
    };
    if (!process.env.WS_NO_BUFFER_UTIL) {
      try {
        const bufferUtil = __require("bufferutil");
        module.exports.mask = function(source, mask, output, offset, length) {
          if (length < 48) _mask(source, mask, output, offset, length);
          else bufferUtil.mask(source, mask, output, offset, length);
        };
        module.exports.unmask = function(buffer, mask) {
          if (buffer.length < 32) _unmask(buffer, mask);
          else bufferUtil.unmask(buffer, mask);
        };
      } catch (e) {
      }
    }
  }
});

// node_modules/.pnpm/ws@8.19.0/node_modules/ws/lib/limiter.js
var require_limiter = __commonJS({
  "node_modules/.pnpm/ws@8.19.0/node_modules/ws/lib/limiter.js"(exports, module) {
    "use strict";
    var kDone = Symbol("kDone");
    var kRun = Symbol("kRun");
    var Limiter = class {
      static {
        __name(this, "Limiter");
      }
      /**
       * Creates a new `Limiter`.
       *
       * @param {Number} [concurrency=Infinity] The maximum number of jobs allowed
       *     to run concurrently
       */
      constructor(concurrency) {
        this[kDone] = () => {
          this.pending--;
          this[kRun]();
        };
        this.concurrency = concurrency || Infinity;
        this.jobs = [];
        this.pending = 0;
      }
      /**
       * Adds a job to the queue.
       *
       * @param {Function} job The job to run
       * @public
       */
      add(job) {
        this.jobs.push(job);
        this[kRun]();
      }
      /**
       * Removes a job from the queue and runs it if possible.
       *
       * @private
       */
      [kRun]() {
        if (this.pending === this.concurrency) return;
        if (this.jobs.length) {
          const job = this.jobs.shift();
          this.pending++;
          job(this[kDone]);
        }
      }
    };
    module.exports = Limiter;
  }
});

// node_modules/.pnpm/ws@8.19.0/node_modules/ws/lib/permessage-deflate.js
var require_permessage_deflate = __commonJS({
  "node_modules/.pnpm/ws@8.19.0/node_modules/ws/lib/permessage-deflate.js"(exports, module) {
    "use strict";
    var zlib = __require("zlib");
    var bufferUtil = require_buffer_util();
    var Limiter = require_limiter();
    var { kStatusCode } = require_constants();
    var FastBuffer = Buffer[Symbol.species];
    var TRAILER = Buffer.from([0, 0, 255, 255]);
    var kPerMessageDeflate = Symbol("permessage-deflate");
    var kTotalLength = Symbol("total-length");
    var kCallback = Symbol("callback");
    var kBuffers = Symbol("buffers");
    var kError = Symbol("error");
    var zlibLimiter;
    var PerMessageDeflate = class {
      static {
        __name(this, "PerMessageDeflate");
      }
      /**
       * Creates a PerMessageDeflate instance.
       *
       * @param {Object} [options] Configuration options
       * @param {(Boolean|Number)} [options.clientMaxWindowBits] Advertise support
       *     for, or request, a custom client window size
       * @param {Boolean} [options.clientNoContextTakeover=false] Advertise/
       *     acknowledge disabling of client context takeover
       * @param {Number} [options.concurrencyLimit=10] The number of concurrent
       *     calls to zlib
       * @param {(Boolean|Number)} [options.serverMaxWindowBits] Request/confirm the
       *     use of a custom server window size
       * @param {Boolean} [options.serverNoContextTakeover=false] Request/accept
       *     disabling of server context takeover
       * @param {Number} [options.threshold=1024] Size (in bytes) below which
       *     messages should not be compressed if context takeover is disabled
       * @param {Object} [options.zlibDeflateOptions] Options to pass to zlib on
       *     deflate
       * @param {Object} [options.zlibInflateOptions] Options to pass to zlib on
       *     inflate
       * @param {Boolean} [isServer=false] Create the instance in either server or
       *     client mode
       * @param {Number} [maxPayload=0] The maximum allowed message length
       */
      constructor(options, isServer, maxPayload) {
        this._maxPayload = maxPayload | 0;
        this._options = options || {};
        this._threshold = this._options.threshold !== void 0 ? this._options.threshold : 1024;
        this._isServer = !!isServer;
        this._deflate = null;
        this._inflate = null;
        this.params = null;
        if (!zlibLimiter) {
          const concurrency = this._options.concurrencyLimit !== void 0 ? this._options.concurrencyLimit : 10;
          zlibLimiter = new Limiter(concurrency);
        }
      }
      /**
       * @type {String}
       */
      static get extensionName() {
        return "permessage-deflate";
      }
      /**
       * Create an extension negotiation offer.
       *
       * @return {Object} Extension parameters
       * @public
       */
      offer() {
        const params = {};
        if (this._options.serverNoContextTakeover) {
          params.server_no_context_takeover = true;
        }
        if (this._options.clientNoContextTakeover) {
          params.client_no_context_takeover = true;
        }
        if (this._options.serverMaxWindowBits) {
          params.server_max_window_bits = this._options.serverMaxWindowBits;
        }
        if (this._options.clientMaxWindowBits) {
          params.client_max_window_bits = this._options.clientMaxWindowBits;
        } else if (this._options.clientMaxWindowBits == null) {
          params.client_max_window_bits = true;
        }
        return params;
      }
      /**
       * Accept an extension negotiation offer/response.
       *
       * @param {Array} configurations The extension negotiation offers/reponse
       * @return {Object} Accepted configuration
       * @public
       */
      accept(configurations) {
        configurations = this.normalizeParams(configurations);
        this.params = this._isServer ? this.acceptAsServer(configurations) : this.acceptAsClient(configurations);
        return this.params;
      }
      /**
       * Releases all resources used by the extension.
       *
       * @public
       */
      cleanup() {
        if (this._inflate) {
          this._inflate.close();
          this._inflate = null;
        }
        if (this._deflate) {
          const callback = this._deflate[kCallback];
          this._deflate.close();
          this._deflate = null;
          if (callback) {
            callback(
              new Error(
                "The deflate stream was closed while data was being processed"
              )
            );
          }
        }
      }
      /**
       *  Accept an extension negotiation offer.
       *
       * @param {Array} offers The extension negotiation offers
       * @return {Object} Accepted configuration
       * @private
       */
      acceptAsServer(offers) {
        const opts = this._options;
        const accepted = offers.find((params) => {
          if (opts.serverNoContextTakeover === false && params.server_no_context_takeover || params.server_max_window_bits && (opts.serverMaxWindowBits === false || typeof opts.serverMaxWindowBits === "number" && opts.serverMaxWindowBits > params.server_max_window_bits) || typeof opts.clientMaxWindowBits === "number" && !params.client_max_window_bits) {
            return false;
          }
          return true;
        });
        if (!accepted) {
          throw new Error("None of the extension offers can be accepted");
        }
        if (opts.serverNoContextTakeover) {
          accepted.server_no_context_takeover = true;
        }
        if (opts.clientNoContextTakeover) {
          accepted.client_no_context_takeover = true;
        }
        if (typeof opts.serverMaxWindowBits === "number") {
          accepted.server_max_window_bits = opts.serverMaxWindowBits;
        }
        if (typeof opts.clientMaxWindowBits === "number") {
          accepted.client_max_window_bits = opts.clientMaxWindowBits;
        } else if (accepted.client_max_window_bits === true || opts.clientMaxWindowBits === false) {
          delete accepted.client_max_window_bits;
        }
        return accepted;
      }
      /**
       * Accept the extension negotiation response.
       *
       * @param {Array} response The extension negotiation response
       * @return {Object} Accepted configuration
       * @private
       */
      acceptAsClient(response) {
        const params = response[0];
        if (this._options.clientNoContextTakeover === false && params.client_no_context_takeover) {
          throw new Error('Unexpected parameter "client_no_context_takeover"');
        }
        if (!params.client_max_window_bits) {
          if (typeof this._options.clientMaxWindowBits === "number") {
            params.client_max_window_bits = this._options.clientMaxWindowBits;
          }
        } else if (this._options.clientMaxWindowBits === false || typeof this._options.clientMaxWindowBits === "number" && params.client_max_window_bits > this._options.clientMaxWindowBits) {
          throw new Error(
            'Unexpected or invalid parameter "client_max_window_bits"'
          );
        }
        return params;
      }
      /**
       * Normalize parameters.
       *
       * @param {Array} configurations The extension negotiation offers/reponse
       * @return {Array} The offers/response with normalized parameters
       * @private
       */
      normalizeParams(configurations) {
        configurations.forEach((params) => {
          Object.keys(params).forEach((key) => {
            let value = params[key];
            if (value.length > 1) {
              throw new Error(`Parameter "${key}" must have only a single value`);
            }
            value = value[0];
            if (key === "client_max_window_bits") {
              if (value !== true) {
                const num = +value;
                if (!Number.isInteger(num) || num < 8 || num > 15) {
                  throw new TypeError(
                    `Invalid value for parameter "${key}": ${value}`
                  );
                }
                value = num;
              } else if (!this._isServer) {
                throw new TypeError(
                  `Invalid value for parameter "${key}": ${value}`
                );
              }
            } else if (key === "server_max_window_bits") {
              const num = +value;
              if (!Number.isInteger(num) || num < 8 || num > 15) {
                throw new TypeError(
                  `Invalid value for parameter "${key}": ${value}`
                );
              }
              value = num;
            } else if (key === "client_no_context_takeover" || key === "server_no_context_takeover") {
              if (value !== true) {
                throw new TypeError(
                  `Invalid value for parameter "${key}": ${value}`
                );
              }
            } else {
              throw new Error(`Unknown parameter "${key}"`);
            }
            params[key] = value;
          });
        });
        return configurations;
      }
      /**
       * Decompress data. Concurrency limited.
       *
       * @param {Buffer} data Compressed data
       * @param {Boolean} fin Specifies whether or not this is the last fragment
       * @param {Function} callback Callback
       * @public
       */
      decompress(data, fin, callback) {
        zlibLimiter.add((done) => {
          this._decompress(data, fin, (err, result) => {
            done();
            callback(err, result);
          });
        });
      }
      /**
       * Compress data. Concurrency limited.
       *
       * @param {(Buffer|String)} data Data to compress
       * @param {Boolean} fin Specifies whether or not this is the last fragment
       * @param {Function} callback Callback
       * @public
       */
      compress(data, fin, callback) {
        zlibLimiter.add((done) => {
          this._compress(data, fin, (err, result) => {
            done();
            callback(err, result);
          });
        });
      }
      /**
       * Decompress data.
       *
       * @param {Buffer} data Compressed data
       * @param {Boolean} fin Specifies whether or not this is the last fragment
       * @param {Function} callback Callback
       * @private
       */
      _decompress(data, fin, callback) {
        const endpoint = this._isServer ? "client" : "server";
        if (!this._inflate) {
          const key = `${endpoint}_max_window_bits`;
          const windowBits = typeof this.params[key] !== "number" ? zlib.Z_DEFAULT_WINDOWBITS : this.params[key];
          this._inflate = zlib.createInflateRaw({
            ...this._options.zlibInflateOptions,
            windowBits
          });
          this._inflate[kPerMessageDeflate] = this;
          this._inflate[kTotalLength] = 0;
          this._inflate[kBuffers] = [];
          this._inflate.on("error", inflateOnError);
          this._inflate.on("data", inflateOnData);
        }
        this._inflate[kCallback] = callback;
        this._inflate.write(data);
        if (fin) this._inflate.write(TRAILER);
        this._inflate.flush(() => {
          const err = this._inflate[kError];
          if (err) {
            this._inflate.close();
            this._inflate = null;
            callback(err);
            return;
          }
          const data2 = bufferUtil.concat(
            this._inflate[kBuffers],
            this._inflate[kTotalLength]
          );
          if (this._inflate._readableState.endEmitted) {
            this._inflate.close();
            this._inflate = null;
          } else {
            this._inflate[kTotalLength] = 0;
            this._inflate[kBuffers] = [];
            if (fin && this.params[`${endpoint}_no_context_takeover`]) {
              this._inflate.reset();
            }
          }
          callback(null, data2);
        });
      }
      /**
       * Compress data.
       *
       * @param {(Buffer|String)} data Data to compress
       * @param {Boolean} fin Specifies whether or not this is the last fragment
       * @param {Function} callback Callback
       * @private
       */
      _compress(data, fin, callback) {
        const endpoint = this._isServer ? "server" : "client";
        if (!this._deflate) {
          const key = `${endpoint}_max_window_bits`;
          const windowBits = typeof this.params[key] !== "number" ? zlib.Z_DEFAULT_WINDOWBITS : this.params[key];
          this._deflate = zlib.createDeflateRaw({
            ...this._options.zlibDeflateOptions,
            windowBits
          });
          this._deflate[kTotalLength] = 0;
          this._deflate[kBuffers] = [];
          this._deflate.on("data", deflateOnData);
        }
        this._deflate[kCallback] = callback;
        this._deflate.write(data);
        this._deflate.flush(zlib.Z_SYNC_FLUSH, () => {
          if (!this._deflate) {
            return;
          }
          let data2 = bufferUtil.concat(
            this._deflate[kBuffers],
            this._deflate[kTotalLength]
          );
          if (fin) {
            data2 = new FastBuffer(data2.buffer, data2.byteOffset, data2.length - 4);
          }
          this._deflate[kCallback] = null;
          this._deflate[kTotalLength] = 0;
          this._deflate[kBuffers] = [];
          if (fin && this.params[`${endpoint}_no_context_takeover`]) {
            this._deflate.reset();
          }
          callback(null, data2);
        });
      }
    };
    module.exports = PerMessageDeflate;
    function deflateOnData(chunk) {
      this[kBuffers].push(chunk);
      this[kTotalLength] += chunk.length;
    }
    __name(deflateOnData, "deflateOnData");
    function inflateOnData(chunk) {
      this[kTotalLength] += chunk.length;
      if (this[kPerMessageDeflate]._maxPayload < 1 || this[kTotalLength] <= this[kPerMessageDeflate]._maxPayload) {
        this[kBuffers].push(chunk);
        return;
      }
      this[kError] = new RangeError("Max payload size exceeded");
      this[kError].code = "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH";
      this[kError][kStatusCode] = 1009;
      this.removeListener("data", inflateOnData);
      this.reset();
    }
    __name(inflateOnData, "inflateOnData");
    function inflateOnError(err) {
      this[kPerMessageDeflate]._inflate = null;
      if (this[kError]) {
        this[kCallback](this[kError]);
        return;
      }
      err[kStatusCode] = 1007;
      this[kCallback](err);
    }
    __name(inflateOnError, "inflateOnError");
  }
});

// node_modules/.pnpm/ws@8.19.0/node_modules/ws/lib/validation.js
var require_validation = __commonJS({
  "node_modules/.pnpm/ws@8.19.0/node_modules/ws/lib/validation.js"(exports, module) {
    "use strict";
    var { isUtf8 } = __require("buffer");
    var { hasBlob } = require_constants();
    var tokenChars = [
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      // 0 - 15
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      // 16 - 31
      0,
      1,
      0,
      1,
      1,
      1,
      1,
      1,
      0,
      0,
      1,
      1,
      0,
      1,
      1,
      0,
      // 32 - 47
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      0,
      0,
      0,
      0,
      0,
      0,
      // 48 - 63
      0,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      // 64 - 79
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      0,
      0,
      0,
      1,
      1,
      // 80 - 95
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      // 96 - 111
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      0,
      1,
      0,
      1,
      0
      // 112 - 127
    ];
    function isValidStatusCode(code) {
      return code >= 1e3 && code <= 1014 && code !== 1004 && code !== 1005 && code !== 1006 || code >= 3e3 && code <= 4999;
    }
    __name(isValidStatusCode, "isValidStatusCode");
    function _isValidUTF8(buf) {
      const len = buf.length;
      let i = 0;
      while (i < len) {
        if ((buf[i] & 128) === 0) {
          i++;
        } else if ((buf[i] & 224) === 192) {
          if (i + 1 === len || (buf[i + 1] & 192) !== 128 || (buf[i] & 254) === 192) {
            return false;
          }
          i += 2;
        } else if ((buf[i] & 240) === 224) {
          if (i + 2 >= len || (buf[i + 1] & 192) !== 128 || (buf[i + 2] & 192) !== 128 || buf[i] === 224 && (buf[i + 1] & 224) === 128 || // Overlong
          buf[i] === 237 && (buf[i + 1] & 224) === 160) {
            return false;
          }
          i += 3;
        } else if ((buf[i] & 248) === 240) {
          if (i + 3 >= len || (buf[i + 1] & 192) !== 128 || (buf[i + 2] & 192) !== 128 || (buf[i + 3] & 192) !== 128 || buf[i] === 240 && (buf[i + 1] & 240) === 128 || // Overlong
          buf[i] === 244 && buf[i + 1] > 143 || buf[i] > 244) {
            return false;
          }
          i += 4;
        } else {
          return false;
        }
      }
      return true;
    }
    __name(_isValidUTF8, "_isValidUTF8");
    function isBlob(value) {
      return hasBlob && typeof value === "object" && typeof value.arrayBuffer === "function" && typeof value.type === "string" && typeof value.stream === "function" && (value[Symbol.toStringTag] === "Blob" || value[Symbol.toStringTag] === "File");
    }
    __name(isBlob, "isBlob");
    module.exports = {
      isBlob,
      isValidStatusCode,
      isValidUTF8: _isValidUTF8,
      tokenChars
    };
    if (isUtf8) {
      module.exports.isValidUTF8 = function(buf) {
        return buf.length < 24 ? _isValidUTF8(buf) : isUtf8(buf);
      };
    } else if (!process.env.WS_NO_UTF_8_VALIDATE) {
      try {
        const isValidUTF8 = __require("utf-8-validate");
        module.exports.isValidUTF8 = function(buf) {
          return buf.length < 32 ? _isValidUTF8(buf) : isValidUTF8(buf);
        };
      } catch (e) {
      }
    }
  }
});

// node_modules/.pnpm/ws@8.19.0/node_modules/ws/lib/receiver.js
var require_receiver = __commonJS({
  "node_modules/.pnpm/ws@8.19.0/node_modules/ws/lib/receiver.js"(exports, module) {
    "use strict";
    var { Writable } = __require("stream");
    var PerMessageDeflate = require_permessage_deflate();
    var {
      BINARY_TYPES,
      EMPTY_BUFFER,
      kStatusCode,
      kWebSocket
    } = require_constants();
    var { concat: concat2, toArrayBuffer, unmask } = require_buffer_util();
    var { isValidStatusCode, isValidUTF8 } = require_validation();
    var FastBuffer = Buffer[Symbol.species];
    var GET_INFO = 0;
    var GET_PAYLOAD_LENGTH_16 = 1;
    var GET_PAYLOAD_LENGTH_64 = 2;
    var GET_MASK = 3;
    var GET_DATA = 4;
    var INFLATING = 5;
    var DEFER_EVENT = 6;
    var Receiver2 = class extends Writable {
      static {
        __name(this, "Receiver");
      }
      /**
       * Creates a Receiver instance.
       *
       * @param {Object} [options] Options object
       * @param {Boolean} [options.allowSynchronousEvents=true] Specifies whether
       *     any of the `'message'`, `'ping'`, and `'pong'` events can be emitted
       *     multiple times in the same tick
       * @param {String} [options.binaryType=nodebuffer] The type for binary data
       * @param {Object} [options.extensions] An object containing the negotiated
       *     extensions
       * @param {Boolean} [options.isServer=false] Specifies whether to operate in
       *     client or server mode
       * @param {Number} [options.maxPayload=0] The maximum allowed message length
       * @param {Boolean} [options.skipUTF8Validation=false] Specifies whether or
       *     not to skip UTF-8 validation for text and close messages
       */
      constructor(options = {}) {
        super();
        this._allowSynchronousEvents = options.allowSynchronousEvents !== void 0 ? options.allowSynchronousEvents : true;
        this._binaryType = options.binaryType || BINARY_TYPES[0];
        this._extensions = options.extensions || {};
        this._isServer = !!options.isServer;
        this._maxPayload = options.maxPayload | 0;
        this._skipUTF8Validation = !!options.skipUTF8Validation;
        this[kWebSocket] = void 0;
        this._bufferedBytes = 0;
        this._buffers = [];
        this._compressed = false;
        this._payloadLength = 0;
        this._mask = void 0;
        this._fragmented = 0;
        this._masked = false;
        this._fin = false;
        this._opcode = 0;
        this._totalPayloadLength = 0;
        this._messageLength = 0;
        this._fragments = [];
        this._errored = false;
        this._loop = false;
        this._state = GET_INFO;
      }
      /**
       * Implements `Writable.prototype._write()`.
       *
       * @param {Buffer} chunk The chunk of data to write
       * @param {String} encoding The character encoding of `chunk`
       * @param {Function} cb Callback
       * @private
       */
      _write(chunk, encoding, cb) {
        if (this._opcode === 8 && this._state == GET_INFO) return cb();
        this._bufferedBytes += chunk.length;
        this._buffers.push(chunk);
        this.startLoop(cb);
      }
      /**
       * Consumes `n` bytes from the buffered data.
       *
       * @param {Number} n The number of bytes to consume
       * @return {Buffer} The consumed bytes
       * @private
       */
      consume(n) {
        this._bufferedBytes -= n;
        if (n === this._buffers[0].length) return this._buffers.shift();
        if (n < this._buffers[0].length) {
          const buf = this._buffers[0];
          this._buffers[0] = new FastBuffer(
            buf.buffer,
            buf.byteOffset + n,
            buf.length - n
          );
          return new FastBuffer(buf.buffer, buf.byteOffset, n);
        }
        const dst = Buffer.allocUnsafe(n);
        do {
          const buf = this._buffers[0];
          const offset = dst.length - n;
          if (n >= buf.length) {
            dst.set(this._buffers.shift(), offset);
          } else {
            dst.set(new Uint8Array(buf.buffer, buf.byteOffset, n), offset);
            this._buffers[0] = new FastBuffer(
              buf.buffer,
              buf.byteOffset + n,
              buf.length - n
            );
          }
          n -= buf.length;
        } while (n > 0);
        return dst;
      }
      /**
       * Starts the parsing loop.
       *
       * @param {Function} cb Callback
       * @private
       */
      startLoop(cb) {
        this._loop = true;
        do {
          switch (this._state) {
            case GET_INFO:
              this.getInfo(cb);
              break;
            case GET_PAYLOAD_LENGTH_16:
              this.getPayloadLength16(cb);
              break;
            case GET_PAYLOAD_LENGTH_64:
              this.getPayloadLength64(cb);
              break;
            case GET_MASK:
              this.getMask();
              break;
            case GET_DATA:
              this.getData(cb);
              break;
            case INFLATING:
            case DEFER_EVENT:
              this._loop = false;
              return;
          }
        } while (this._loop);
        if (!this._errored) cb();
      }
      /**
       * Reads the first two bytes of a frame.
       *
       * @param {Function} cb Callback
       * @private
       */
      getInfo(cb) {
        if (this._bufferedBytes < 2) {
          this._loop = false;
          return;
        }
        const buf = this.consume(2);
        if ((buf[0] & 48) !== 0) {
          const error = this.createError(
            RangeError,
            "RSV2 and RSV3 must be clear",
            true,
            1002,
            "WS_ERR_UNEXPECTED_RSV_2_3"
          );
          cb(error);
          return;
        }
        const compressed = (buf[0] & 64) === 64;
        if (compressed && !this._extensions[PerMessageDeflate.extensionName]) {
          const error = this.createError(
            RangeError,
            "RSV1 must be clear",
            true,
            1002,
            "WS_ERR_UNEXPECTED_RSV_1"
          );
          cb(error);
          return;
        }
        this._fin = (buf[0] & 128) === 128;
        this._opcode = buf[0] & 15;
        this._payloadLength = buf[1] & 127;
        if (this._opcode === 0) {
          if (compressed) {
            const error = this.createError(
              RangeError,
              "RSV1 must be clear",
              true,
              1002,
              "WS_ERR_UNEXPECTED_RSV_1"
            );
            cb(error);
            return;
          }
          if (!this._fragmented) {
            const error = this.createError(
              RangeError,
              "invalid opcode 0",
              true,
              1002,
              "WS_ERR_INVALID_OPCODE"
            );
            cb(error);
            return;
          }
          this._opcode = this._fragmented;
        } else if (this._opcode === 1 || this._opcode === 2) {
          if (this._fragmented) {
            const error = this.createError(
              RangeError,
              `invalid opcode ${this._opcode}`,
              true,
              1002,
              "WS_ERR_INVALID_OPCODE"
            );
            cb(error);
            return;
          }
          this._compressed = compressed;
        } else if (this._opcode > 7 && this._opcode < 11) {
          if (!this._fin) {
            const error = this.createError(
              RangeError,
              "FIN must be set",
              true,
              1002,
              "WS_ERR_EXPECTED_FIN"
            );
            cb(error);
            return;
          }
          if (compressed) {
            const error = this.createError(
              RangeError,
              "RSV1 must be clear",
              true,
              1002,
              "WS_ERR_UNEXPECTED_RSV_1"
            );
            cb(error);
            return;
          }
          if (this._payloadLength > 125 || this._opcode === 8 && this._payloadLength === 1) {
            const error = this.createError(
              RangeError,
              `invalid payload length ${this._payloadLength}`,
              true,
              1002,
              "WS_ERR_INVALID_CONTROL_PAYLOAD_LENGTH"
            );
            cb(error);
            return;
          }
        } else {
          const error = this.createError(
            RangeError,
            `invalid opcode ${this._opcode}`,
            true,
            1002,
            "WS_ERR_INVALID_OPCODE"
          );
          cb(error);
          return;
        }
        if (!this._fin && !this._fragmented) this._fragmented = this._opcode;
        this._masked = (buf[1] & 128) === 128;
        if (this._isServer) {
          if (!this._masked) {
            const error = this.createError(
              RangeError,
              "MASK must be set",
              true,
              1002,
              "WS_ERR_EXPECTED_MASK"
            );
            cb(error);
            return;
          }
        } else if (this._masked) {
          const error = this.createError(
            RangeError,
            "MASK must be clear",
            true,
            1002,
            "WS_ERR_UNEXPECTED_MASK"
          );
          cb(error);
          return;
        }
        if (this._payloadLength === 126) this._state = GET_PAYLOAD_LENGTH_16;
        else if (this._payloadLength === 127) this._state = GET_PAYLOAD_LENGTH_64;
        else this.haveLength(cb);
      }
      /**
       * Gets extended payload length (7+16).
       *
       * @param {Function} cb Callback
       * @private
       */
      getPayloadLength16(cb) {
        if (this._bufferedBytes < 2) {
          this._loop = false;
          return;
        }
        this._payloadLength = this.consume(2).readUInt16BE(0);
        this.haveLength(cb);
      }
      /**
       * Gets extended payload length (7+64).
       *
       * @param {Function} cb Callback
       * @private
       */
      getPayloadLength64(cb) {
        if (this._bufferedBytes < 8) {
          this._loop = false;
          return;
        }
        const buf = this.consume(8);
        const num = buf.readUInt32BE(0);
        if (num > Math.pow(2, 53 - 32) - 1) {
          const error = this.createError(
            RangeError,
            "Unsupported WebSocket frame: payload length > 2^53 - 1",
            false,
            1009,
            "WS_ERR_UNSUPPORTED_DATA_PAYLOAD_LENGTH"
          );
          cb(error);
          return;
        }
        this._payloadLength = num * Math.pow(2, 32) + buf.readUInt32BE(4);
        this.haveLength(cb);
      }
      /**
       * Payload length has been read.
       *
       * @param {Function} cb Callback
       * @private
       */
      haveLength(cb) {
        if (this._payloadLength && this._opcode < 8) {
          this._totalPayloadLength += this._payloadLength;
          if (this._totalPayloadLength > this._maxPayload && this._maxPayload > 0) {
            const error = this.createError(
              RangeError,
              "Max payload size exceeded",
              false,
              1009,
              "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH"
            );
            cb(error);
            return;
          }
        }
        if (this._masked) this._state = GET_MASK;
        else this._state = GET_DATA;
      }
      /**
       * Reads mask bytes.
       *
       * @private
       */
      getMask() {
        if (this._bufferedBytes < 4) {
          this._loop = false;
          return;
        }
        this._mask = this.consume(4);
        this._state = GET_DATA;
      }
      /**
       * Reads data bytes.
       *
       * @param {Function} cb Callback
       * @private
       */
      getData(cb) {
        let data = EMPTY_BUFFER;
        if (this._payloadLength) {
          if (this._bufferedBytes < this._payloadLength) {
            this._loop = false;
            return;
          }
          data = this.consume(this._payloadLength);
          if (this._masked && (this._mask[0] | this._mask[1] | this._mask[2] | this._mask[3]) !== 0) {
            unmask(data, this._mask);
          }
        }
        if (this._opcode > 7) {
          this.controlMessage(data, cb);
          return;
        }
        if (this._compressed) {
          this._state = INFLATING;
          this.decompress(data, cb);
          return;
        }
        if (data.length) {
          this._messageLength = this._totalPayloadLength;
          this._fragments.push(data);
        }
        this.dataMessage(cb);
      }
      /**
       * Decompresses data.
       *
       * @param {Buffer} data Compressed data
       * @param {Function} cb Callback
       * @private
       */
      decompress(data, cb) {
        const perMessageDeflate = this._extensions[PerMessageDeflate.extensionName];
        perMessageDeflate.decompress(data, this._fin, (err, buf) => {
          if (err) return cb(err);
          if (buf.length) {
            this._messageLength += buf.length;
            if (this._messageLength > this._maxPayload && this._maxPayload > 0) {
              const error = this.createError(
                RangeError,
                "Max payload size exceeded",
                false,
                1009,
                "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH"
              );
              cb(error);
              return;
            }
            this._fragments.push(buf);
          }
          this.dataMessage(cb);
          if (this._state === GET_INFO) this.startLoop(cb);
        });
      }
      /**
       * Handles a data message.
       *
       * @param {Function} cb Callback
       * @private
       */
      dataMessage(cb) {
        if (!this._fin) {
          this._state = GET_INFO;
          return;
        }
        const messageLength = this._messageLength;
        const fragments = this._fragments;
        this._totalPayloadLength = 0;
        this._messageLength = 0;
        this._fragmented = 0;
        this._fragments = [];
        if (this._opcode === 2) {
          let data;
          if (this._binaryType === "nodebuffer") {
            data = concat2(fragments, messageLength);
          } else if (this._binaryType === "arraybuffer") {
            data = toArrayBuffer(concat2(fragments, messageLength));
          } else if (this._binaryType === "blob") {
            data = new Blob(fragments);
          } else {
            data = fragments;
          }
          if (this._allowSynchronousEvents) {
            this.emit("message", data, true);
            this._state = GET_INFO;
          } else {
            this._state = DEFER_EVENT;
            setImmediate(() => {
              this.emit("message", data, true);
              this._state = GET_INFO;
              this.startLoop(cb);
            });
          }
        } else {
          const buf = concat2(fragments, messageLength);
          if (!this._skipUTF8Validation && !isValidUTF8(buf)) {
            const error = this.createError(
              Error,
              "invalid UTF-8 sequence",
              true,
              1007,
              "WS_ERR_INVALID_UTF8"
            );
            cb(error);
            return;
          }
          if (this._state === INFLATING || this._allowSynchronousEvents) {
            this.emit("message", buf, false);
            this._state = GET_INFO;
          } else {
            this._state = DEFER_EVENT;
            setImmediate(() => {
              this.emit("message", buf, false);
              this._state = GET_INFO;
              this.startLoop(cb);
            });
          }
        }
      }
      /**
       * Handles a control message.
       *
       * @param {Buffer} data Data to handle
       * @return {(Error|RangeError|undefined)} A possible error
       * @private
       */
      controlMessage(data, cb) {
        if (this._opcode === 8) {
          if (data.length === 0) {
            this._loop = false;
            this.emit("conclude", 1005, EMPTY_BUFFER);
            this.end();
          } else {
            const code = data.readUInt16BE(0);
            if (!isValidStatusCode(code)) {
              const error = this.createError(
                RangeError,
                `invalid status code ${code}`,
                true,
                1002,
                "WS_ERR_INVALID_CLOSE_CODE"
              );
              cb(error);
              return;
            }
            const buf = new FastBuffer(
              data.buffer,
              data.byteOffset + 2,
              data.length - 2
            );
            if (!this._skipUTF8Validation && !isValidUTF8(buf)) {
              const error = this.createError(
                Error,
                "invalid UTF-8 sequence",
                true,
                1007,
                "WS_ERR_INVALID_UTF8"
              );
              cb(error);
              return;
            }
            this._loop = false;
            this.emit("conclude", code, buf);
            this.end();
          }
          this._state = GET_INFO;
          return;
        }
        if (this._allowSynchronousEvents) {
          this.emit(this._opcode === 9 ? "ping" : "pong", data);
          this._state = GET_INFO;
        } else {
          this._state = DEFER_EVENT;
          setImmediate(() => {
            this.emit(this._opcode === 9 ? "ping" : "pong", data);
            this._state = GET_INFO;
            this.startLoop(cb);
          });
        }
      }
      /**
       * Builds an error object.
       *
       * @param {function(new:Error|RangeError)} ErrorCtor The error constructor
       * @param {String} message The error message
       * @param {Boolean} prefix Specifies whether or not to add a default prefix to
       *     `message`
       * @param {Number} statusCode The status code
       * @param {String} errorCode The exposed error code
       * @return {(Error|RangeError)} The error
       * @private
       */
      createError(ErrorCtor, message2, prefix, statusCode, errorCode) {
        this._loop = false;
        this._errored = true;
        const err = new ErrorCtor(
          prefix ? `Invalid WebSocket frame: ${message2}` : message2
        );
        Error.captureStackTrace(err, this.createError);
        err.code = errorCode;
        err[kStatusCode] = statusCode;
        return err;
      }
    };
    module.exports = Receiver2;
  }
});

// node_modules/.pnpm/ws@8.19.0/node_modules/ws/lib/sender.js
var require_sender = __commonJS({
  "node_modules/.pnpm/ws@8.19.0/node_modules/ws/lib/sender.js"(exports, module) {
    "use strict";
    var { Duplex } = __require("stream");
    var { randomFillSync } = __require("crypto");
    var PerMessageDeflate = require_permessage_deflate();
    var { EMPTY_BUFFER, kWebSocket, NOOP } = require_constants();
    var { isBlob, isValidStatusCode } = require_validation();
    var { mask: applyMask, toBuffer } = require_buffer_util();
    var kByteLength = Symbol("kByteLength");
    var maskBuffer = Buffer.alloc(4);
    var RANDOM_POOL_SIZE = 8 * 1024;
    var randomPool;
    var randomPoolPointer = RANDOM_POOL_SIZE;
    var DEFAULT = 0;
    var DEFLATING = 1;
    var GET_BLOB_DATA = 2;
    var Sender2 = class _Sender {
      static {
        __name(this, "Sender");
      }
      /**
       * Creates a Sender instance.
       *
       * @param {Duplex} socket The connection socket
       * @param {Object} [extensions] An object containing the negotiated extensions
       * @param {Function} [generateMask] The function used to generate the masking
       *     key
       */
      constructor(socket, extensions, generateMask) {
        this._extensions = extensions || {};
        if (generateMask) {
          this._generateMask = generateMask;
          this._maskBuffer = Buffer.alloc(4);
        }
        this._socket = socket;
        this._firstFragment = true;
        this._compress = false;
        this._bufferedBytes = 0;
        this._queue = [];
        this._state = DEFAULT;
        this.onerror = NOOP;
        this[kWebSocket] = void 0;
      }
      /**
       * Frames a piece of data according to the HyBi WebSocket protocol.
       *
       * @param {(Buffer|String)} data The data to frame
       * @param {Object} options Options object
       * @param {Boolean} [options.fin=false] Specifies whether or not to set the
       *     FIN bit
       * @param {Function} [options.generateMask] The function used to generate the
       *     masking key
       * @param {Boolean} [options.mask=false] Specifies whether or not to mask
       *     `data`
       * @param {Buffer} [options.maskBuffer] The buffer used to store the masking
       *     key
       * @param {Number} options.opcode The opcode
       * @param {Boolean} [options.readOnly=false] Specifies whether `data` can be
       *     modified
       * @param {Boolean} [options.rsv1=false] Specifies whether or not to set the
       *     RSV1 bit
       * @return {(Buffer|String)[]} The framed data
       * @public
       */
      static frame(data, options) {
        let mask;
        let merge = false;
        let offset = 2;
        let skipMasking = false;
        if (options.mask) {
          mask = options.maskBuffer || maskBuffer;
          if (options.generateMask) {
            options.generateMask(mask);
          } else {
            if (randomPoolPointer === RANDOM_POOL_SIZE) {
              if (randomPool === void 0) {
                randomPool = Buffer.alloc(RANDOM_POOL_SIZE);
              }
              randomFillSync(randomPool, 0, RANDOM_POOL_SIZE);
              randomPoolPointer = 0;
            }
            mask[0] = randomPool[randomPoolPointer++];
            mask[1] = randomPool[randomPoolPointer++];
            mask[2] = randomPool[randomPoolPointer++];
            mask[3] = randomPool[randomPoolPointer++];
          }
          skipMasking = (mask[0] | mask[1] | mask[2] | mask[3]) === 0;
          offset = 6;
        }
        let dataLength;
        if (typeof data === "string") {
          if ((!options.mask || skipMasking) && options[kByteLength] !== void 0) {
            dataLength = options[kByteLength];
          } else {
            data = Buffer.from(data);
            dataLength = data.length;
          }
        } else {
          dataLength = data.length;
          merge = options.mask && options.readOnly && !skipMasking;
        }
        let payloadLength = dataLength;
        if (dataLength >= 65536) {
          offset += 8;
          payloadLength = 127;
        } else if (dataLength > 125) {
          offset += 2;
          payloadLength = 126;
        }
        const target = Buffer.allocUnsafe(merge ? dataLength + offset : offset);
        target[0] = options.fin ? options.opcode | 128 : options.opcode;
        if (options.rsv1) target[0] |= 64;
        target[1] = payloadLength;
        if (payloadLength === 126) {
          target.writeUInt16BE(dataLength, 2);
        } else if (payloadLength === 127) {
          target[2] = target[3] = 0;
          target.writeUIntBE(dataLength, 4, 6);
        }
        if (!options.mask) return [target, data];
        target[1] |= 128;
        target[offset - 4] = mask[0];
        target[offset - 3] = mask[1];
        target[offset - 2] = mask[2];
        target[offset - 1] = mask[3];
        if (skipMasking) return [target, data];
        if (merge) {
          applyMask(data, mask, target, offset, dataLength);
          return [target];
        }
        applyMask(data, mask, data, 0, dataLength);
        return [target, data];
      }
      /**
       * Sends a close message to the other peer.
       *
       * @param {Number} [code] The status code component of the body
       * @param {(String|Buffer)} [data] The message component of the body
       * @param {Boolean} [mask=false] Specifies whether or not to mask the message
       * @param {Function} [cb] Callback
       * @public
       */
      close(code, data, mask, cb) {
        let buf;
        if (code === void 0) {
          buf = EMPTY_BUFFER;
        } else if (typeof code !== "number" || !isValidStatusCode(code)) {
          throw new TypeError("First argument must be a valid error code number");
        } else if (data === void 0 || !data.length) {
          buf = Buffer.allocUnsafe(2);
          buf.writeUInt16BE(code, 0);
        } else {
          const length = Buffer.byteLength(data);
          if (length > 123) {
            throw new RangeError("The message must not be greater than 123 bytes");
          }
          buf = Buffer.allocUnsafe(2 + length);
          buf.writeUInt16BE(code, 0);
          if (typeof data === "string") {
            buf.write(data, 2);
          } else {
            buf.set(data, 2);
          }
        }
        const options = {
          [kByteLength]: buf.length,
          fin: true,
          generateMask: this._generateMask,
          mask,
          maskBuffer: this._maskBuffer,
          opcode: 8,
          readOnly: false,
          rsv1: false
        };
        if (this._state !== DEFAULT) {
          this.enqueue([this.dispatch, buf, false, options, cb]);
        } else {
          this.sendFrame(_Sender.frame(buf, options), cb);
        }
      }
      /**
       * Sends a ping message to the other peer.
       *
       * @param {*} data The message to send
       * @param {Boolean} [mask=false] Specifies whether or not to mask `data`
       * @param {Function} [cb] Callback
       * @public
       */
      ping(data, mask, cb) {
        let byteLength;
        let readOnly;
        if (typeof data === "string") {
          byteLength = Buffer.byteLength(data);
          readOnly = false;
        } else if (isBlob(data)) {
          byteLength = data.size;
          readOnly = false;
        } else {
          data = toBuffer(data);
          byteLength = data.length;
          readOnly = toBuffer.readOnly;
        }
        if (byteLength > 125) {
          throw new RangeError("The data size must not be greater than 125 bytes");
        }
        const options = {
          [kByteLength]: byteLength,
          fin: true,
          generateMask: this._generateMask,
          mask,
          maskBuffer: this._maskBuffer,
          opcode: 9,
          readOnly,
          rsv1: false
        };
        if (isBlob(data)) {
          if (this._state !== DEFAULT) {
            this.enqueue([this.getBlobData, data, false, options, cb]);
          } else {
            this.getBlobData(data, false, options, cb);
          }
        } else if (this._state !== DEFAULT) {
          this.enqueue([this.dispatch, data, false, options, cb]);
        } else {
          this.sendFrame(_Sender.frame(data, options), cb);
        }
      }
      /**
       * Sends a pong message to the other peer.
       *
       * @param {*} data The message to send
       * @param {Boolean} [mask=false] Specifies whether or not to mask `data`
       * @param {Function} [cb] Callback
       * @public
       */
      pong(data, mask, cb) {
        let byteLength;
        let readOnly;
        if (typeof data === "string") {
          byteLength = Buffer.byteLength(data);
          readOnly = false;
        } else if (isBlob(data)) {
          byteLength = data.size;
          readOnly = false;
        } else {
          data = toBuffer(data);
          byteLength = data.length;
          readOnly = toBuffer.readOnly;
        }
        if (byteLength > 125) {
          throw new RangeError("The data size must not be greater than 125 bytes");
        }
        const options = {
          [kByteLength]: byteLength,
          fin: true,
          generateMask: this._generateMask,
          mask,
          maskBuffer: this._maskBuffer,
          opcode: 10,
          readOnly,
          rsv1: false
        };
        if (isBlob(data)) {
          if (this._state !== DEFAULT) {
            this.enqueue([this.getBlobData, data, false, options, cb]);
          } else {
            this.getBlobData(data, false, options, cb);
          }
        } else if (this._state !== DEFAULT) {
          this.enqueue([this.dispatch, data, false, options, cb]);
        } else {
          this.sendFrame(_Sender.frame(data, options), cb);
        }
      }
      /**
       * Sends a data message to the other peer.
       *
       * @param {*} data The message to send
       * @param {Object} options Options object
       * @param {Boolean} [options.binary=false] Specifies whether `data` is binary
       *     or text
       * @param {Boolean} [options.compress=false] Specifies whether or not to
       *     compress `data`
       * @param {Boolean} [options.fin=false] Specifies whether the fragment is the
       *     last one
       * @param {Boolean} [options.mask=false] Specifies whether or not to mask
       *     `data`
       * @param {Function} [cb] Callback
       * @public
       */
      send(data, options, cb) {
        const perMessageDeflate = this._extensions[PerMessageDeflate.extensionName];
        let opcode = options.binary ? 2 : 1;
        let rsv1 = options.compress;
        let byteLength;
        let readOnly;
        if (typeof data === "string") {
          byteLength = Buffer.byteLength(data);
          readOnly = false;
        } else if (isBlob(data)) {
          byteLength = data.size;
          readOnly = false;
        } else {
          data = toBuffer(data);
          byteLength = data.length;
          readOnly = toBuffer.readOnly;
        }
        if (this._firstFragment) {
          this._firstFragment = false;
          if (rsv1 && perMessageDeflate && perMessageDeflate.params[perMessageDeflate._isServer ? "server_no_context_takeover" : "client_no_context_takeover"]) {
            rsv1 = byteLength >= perMessageDeflate._threshold;
          }
          this._compress = rsv1;
        } else {
          rsv1 = false;
          opcode = 0;
        }
        if (options.fin) this._firstFragment = true;
        const opts = {
          [kByteLength]: byteLength,
          fin: options.fin,
          generateMask: this._generateMask,
          mask: options.mask,
          maskBuffer: this._maskBuffer,
          opcode,
          readOnly,
          rsv1
        };
        if (isBlob(data)) {
          if (this._state !== DEFAULT) {
            this.enqueue([this.getBlobData, data, this._compress, opts, cb]);
          } else {
            this.getBlobData(data, this._compress, opts, cb);
          }
        } else if (this._state !== DEFAULT) {
          this.enqueue([this.dispatch, data, this._compress, opts, cb]);
        } else {
          this.dispatch(data, this._compress, opts, cb);
        }
      }
      /**
       * Gets the contents of a blob as binary data.
       *
       * @param {Blob} blob The blob
       * @param {Boolean} [compress=false] Specifies whether or not to compress
       *     the data
       * @param {Object} options Options object
       * @param {Boolean} [options.fin=false] Specifies whether or not to set the
       *     FIN bit
       * @param {Function} [options.generateMask] The function used to generate the
       *     masking key
       * @param {Boolean} [options.mask=false] Specifies whether or not to mask
       *     `data`
       * @param {Buffer} [options.maskBuffer] The buffer used to store the masking
       *     key
       * @param {Number} options.opcode The opcode
       * @param {Boolean} [options.readOnly=false] Specifies whether `data` can be
       *     modified
       * @param {Boolean} [options.rsv1=false] Specifies whether or not to set the
       *     RSV1 bit
       * @param {Function} [cb] Callback
       * @private
       */
      getBlobData(blob2, compress, options, cb) {
        this._bufferedBytes += options[kByteLength];
        this._state = GET_BLOB_DATA;
        blob2.arrayBuffer().then((arrayBuffer) => {
          if (this._socket.destroyed) {
            const err = new Error(
              "The socket was closed while the blob was being read"
            );
            process.nextTick(callCallbacks, this, err, cb);
            return;
          }
          this._bufferedBytes -= options[kByteLength];
          const data = toBuffer(arrayBuffer);
          if (!compress) {
            this._state = DEFAULT;
            this.sendFrame(_Sender.frame(data, options), cb);
            this.dequeue();
          } else {
            this.dispatch(data, compress, options, cb);
          }
        }).catch((err) => {
          process.nextTick(onError, this, err, cb);
        });
      }
      /**
       * Dispatches a message.
       *
       * @param {(Buffer|String)} data The message to send
       * @param {Boolean} [compress=false] Specifies whether or not to compress
       *     `data`
       * @param {Object} options Options object
       * @param {Boolean} [options.fin=false] Specifies whether or not to set the
       *     FIN bit
       * @param {Function} [options.generateMask] The function used to generate the
       *     masking key
       * @param {Boolean} [options.mask=false] Specifies whether or not to mask
       *     `data`
       * @param {Buffer} [options.maskBuffer] The buffer used to store the masking
       *     key
       * @param {Number} options.opcode The opcode
       * @param {Boolean} [options.readOnly=false] Specifies whether `data` can be
       *     modified
       * @param {Boolean} [options.rsv1=false] Specifies whether or not to set the
       *     RSV1 bit
       * @param {Function} [cb] Callback
       * @private
       */
      dispatch(data, compress, options, cb) {
        if (!compress) {
          this.sendFrame(_Sender.frame(data, options), cb);
          return;
        }
        const perMessageDeflate = this._extensions[PerMessageDeflate.extensionName];
        this._bufferedBytes += options[kByteLength];
        this._state = DEFLATING;
        perMessageDeflate.compress(data, options.fin, (_2, buf) => {
          if (this._socket.destroyed) {
            const err = new Error(
              "The socket was closed while data was being compressed"
            );
            callCallbacks(this, err, cb);
            return;
          }
          this._bufferedBytes -= options[kByteLength];
          this._state = DEFAULT;
          options.readOnly = false;
          this.sendFrame(_Sender.frame(buf, options), cb);
          this.dequeue();
        });
      }
      /**
       * Executes queued send operations.
       *
       * @private
       */
      dequeue() {
        while (this._state === DEFAULT && this._queue.length) {
          const params = this._queue.shift();
          this._bufferedBytes -= params[3][kByteLength];
          Reflect.apply(params[0], this, params.slice(1));
        }
      }
      /**
       * Enqueues a send operation.
       *
       * @param {Array} params Send operation parameters.
       * @private
       */
      enqueue(params) {
        this._bufferedBytes += params[3][kByteLength];
        this._queue.push(params);
      }
      /**
       * Sends a frame.
       *
       * @param {(Buffer | String)[]} list The frame to send
       * @param {Function} [cb] Callback
       * @private
       */
      sendFrame(list, cb) {
        if (list.length === 2) {
          this._socket.cork();
          this._socket.write(list[0]);
          this._socket.write(list[1], cb);
          this._socket.uncork();
        } else {
          this._socket.write(list[0], cb);
        }
      }
    };
    module.exports = Sender2;
    function callCallbacks(sender, err, cb) {
      if (typeof cb === "function") cb(err);
      for (let i = 0; i < sender._queue.length; i++) {
        const params = sender._queue[i];
        const callback = params[params.length - 1];
        if (typeof callback === "function") callback(err);
      }
    }
    __name(callCallbacks, "callCallbacks");
    function onError(sender, err, cb) {
      callCallbacks(sender, err, cb);
      sender.onerror(err);
    }
    __name(onError, "onError");
  }
});

// node_modules/.pnpm/ws@8.19.0/node_modules/ws/lib/event-target.js
var require_event_target = __commonJS({
  "node_modules/.pnpm/ws@8.19.0/node_modules/ws/lib/event-target.js"(exports, module) {
    "use strict";
    var { kForOnEventAttribute, kListener } = require_constants();
    var kCode = Symbol("kCode");
    var kData = Symbol("kData");
    var kError = Symbol("kError");
    var kMessage = Symbol("kMessage");
    var kReason = Symbol("kReason");
    var kTarget = Symbol("kTarget");
    var kType = Symbol("kType");
    var kWasClean = Symbol("kWasClean");
    var Event2 = class {
      static {
        __name(this, "Event");
      }
      /**
       * Create a new `Event`.
       *
       * @param {String} type The name of the event
       * @throws {TypeError} If the `type` argument is not specified
       */
      constructor(type) {
        this[kTarget] = null;
        this[kType] = type;
      }
      /**
       * @type {*}
       */
      get target() {
        return this[kTarget];
      }
      /**
       * @type {String}
       */
      get type() {
        return this[kType];
      }
    };
    Object.defineProperty(Event2.prototype, "target", { enumerable: true });
    Object.defineProperty(Event2.prototype, "type", { enumerable: true });
    var CloseEvent2 = class extends Event2 {
      static {
        __name(this, "CloseEvent");
      }
      /**
       * Create a new `CloseEvent`.
       *
       * @param {String} type The name of the event
       * @param {Object} [options] A dictionary object that allows for setting
       *     attributes via object members of the same name
       * @param {Number} [options.code=0] The status code explaining why the
       *     connection was closed
       * @param {String} [options.reason=''] A human-readable string explaining why
       *     the connection was closed
       * @param {Boolean} [options.wasClean=false] Indicates whether or not the
       *     connection was cleanly closed
       */
      constructor(type, options = {}) {
        super(type);
        this[kCode] = options.code === void 0 ? 0 : options.code;
        this[kReason] = options.reason === void 0 ? "" : options.reason;
        this[kWasClean] = options.wasClean === void 0 ? false : options.wasClean;
      }
      /**
       * @type {Number}
       */
      get code() {
        return this[kCode];
      }
      /**
       * @type {String}
       */
      get reason() {
        return this[kReason];
      }
      /**
       * @type {Boolean}
       */
      get wasClean() {
        return this[kWasClean];
      }
    };
    Object.defineProperty(CloseEvent2.prototype, "code", { enumerable: true });
    Object.defineProperty(CloseEvent2.prototype, "reason", { enumerable: true });
    Object.defineProperty(CloseEvent2.prototype, "wasClean", { enumerable: true });
    var ErrorEvent2 = class extends Event2 {
      static {
        __name(this, "ErrorEvent");
      }
      /**
       * Create a new `ErrorEvent`.
       *
       * @param {String} type The name of the event
       * @param {Object} [options] A dictionary object that allows for setting
       *     attributes via object members of the same name
       * @param {*} [options.error=null] The error that generated this event
       * @param {String} [options.message=''] The error message
       */
      constructor(type, options = {}) {
        super(type);
        this[kError] = options.error === void 0 ? null : options.error;
        this[kMessage] = options.message === void 0 ? "" : options.message;
      }
      /**
       * @type {*}
       */
      get error() {
        return this[kError];
      }
      /**
       * @type {String}
       */
      get message() {
        return this[kMessage];
      }
    };
    Object.defineProperty(ErrorEvent2.prototype, "error", { enumerable: true });
    Object.defineProperty(ErrorEvent2.prototype, "message", { enumerable: true });
    var MessageEvent2 = class extends Event2 {
      static {
        __name(this, "MessageEvent");
      }
      /**
       * Create a new `MessageEvent`.
       *
       * @param {String} type The name of the event
       * @param {Object} [options] A dictionary object that allows for setting
       *     attributes via object members of the same name
       * @param {*} [options.data=null] The message content
       */
      constructor(type, options = {}) {
        super(type);
        this[kData] = options.data === void 0 ? null : options.data;
      }
      /**
       * @type {*}
       */
      get data() {
        return this[kData];
      }
    };
    Object.defineProperty(MessageEvent2.prototype, "data", { enumerable: true });
    var EventTarget = {
      /**
       * Register an event listener.
       *
       * @param {String} type A string representing the event type to listen for
       * @param {(Function|Object)} handler The listener to add
       * @param {Object} [options] An options object specifies characteristics about
       *     the event listener
       * @param {Boolean} [options.once=false] A `Boolean` indicating that the
       *     listener should be invoked at most once after being added. If `true`,
       *     the listener would be automatically removed when invoked.
       * @public
       */
      addEventListener(type, handler2, options = {}) {
        for (const listener of this.listeners(type)) {
          if (!options[kForOnEventAttribute] && listener[kListener] === handler2 && !listener[kForOnEventAttribute]) {
            return;
          }
        }
        let wrapper;
        if (type === "message") {
          wrapper = /* @__PURE__ */ __name(function onMessage(data, isBinary) {
            const event = new MessageEvent2("message", {
              data: isBinary ? data : data.toString()
            });
            event[kTarget] = this;
            callListener(handler2, this, event);
          }, "onMessage");
        } else if (type === "close") {
          wrapper = /* @__PURE__ */ __name(function onClose(code, message2) {
            const event = new CloseEvent2("close", {
              code,
              reason: message2.toString(),
              wasClean: this._closeFrameReceived && this._closeFrameSent
            });
            event[kTarget] = this;
            callListener(handler2, this, event);
          }, "onClose");
        } else if (type === "error") {
          wrapper = /* @__PURE__ */ __name(function onError(error) {
            const event = new ErrorEvent2("error", {
              error,
              message: error.message
            });
            event[kTarget] = this;
            callListener(handler2, this, event);
          }, "onError");
        } else if (type === "open") {
          wrapper = /* @__PURE__ */ __name(function onOpen() {
            const event = new Event2("open");
            event[kTarget] = this;
            callListener(handler2, this, event);
          }, "onOpen");
        } else {
          return;
        }
        wrapper[kForOnEventAttribute] = !!options[kForOnEventAttribute];
        wrapper[kListener] = handler2;
        if (options.once) {
          this.once(type, wrapper);
        } else {
          this.on(type, wrapper);
        }
      },
      /**
       * Remove an event listener.
       *
       * @param {String} type A string representing the event type to remove
       * @param {(Function|Object)} handler The listener to remove
       * @public
       */
      removeEventListener(type, handler2) {
        for (const listener of this.listeners(type)) {
          if (listener[kListener] === handler2 && !listener[kForOnEventAttribute]) {
            this.removeListener(type, listener);
            break;
          }
        }
      }
    };
    module.exports = {
      CloseEvent: CloseEvent2,
      ErrorEvent: ErrorEvent2,
      Event: Event2,
      EventTarget,
      MessageEvent: MessageEvent2
    };
    function callListener(listener, thisArg, event) {
      if (typeof listener === "object" && listener.handleEvent) {
        listener.handleEvent.call(listener, event);
      } else {
        listener.call(thisArg, event);
      }
    }
    __name(callListener, "callListener");
  }
});

// node_modules/.pnpm/ws@8.19.0/node_modules/ws/lib/extension.js
var require_extension = __commonJS({
  "node_modules/.pnpm/ws@8.19.0/node_modules/ws/lib/extension.js"(exports, module) {
    "use strict";
    var { tokenChars } = require_validation();
    function push(dest, name, elem) {
      if (dest[name] === void 0) dest[name] = [elem];
      else dest[name].push(elem);
    }
    __name(push, "push");
    function parse(header) {
      const offers = /* @__PURE__ */ Object.create(null);
      let params = /* @__PURE__ */ Object.create(null);
      let mustUnescape = false;
      let isEscaping = false;
      let inQuotes = false;
      let extensionName;
      let paramName;
      let start = -1;
      let code = -1;
      let end = -1;
      let i = 0;
      for (; i < header.length; i++) {
        code = header.charCodeAt(i);
        if (extensionName === void 0) {
          if (end === -1 && tokenChars[code] === 1) {
            if (start === -1) start = i;
          } else if (i !== 0 && (code === 32 || code === 9)) {
            if (end === -1 && start !== -1) end = i;
          } else if (code === 59 || code === 44) {
            if (start === -1) {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
            if (end === -1) end = i;
            const name = header.slice(start, end);
            if (code === 44) {
              push(offers, name, params);
              params = /* @__PURE__ */ Object.create(null);
            } else {
              extensionName = name;
            }
            start = end = -1;
          } else {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }
        } else if (paramName === void 0) {
          if (end === -1 && tokenChars[code] === 1) {
            if (start === -1) start = i;
          } else if (code === 32 || code === 9) {
            if (end === -1 && start !== -1) end = i;
          } else if (code === 59 || code === 44) {
            if (start === -1) {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
            if (end === -1) end = i;
            push(params, header.slice(start, end), true);
            if (code === 44) {
              push(offers, extensionName, params);
              params = /* @__PURE__ */ Object.create(null);
              extensionName = void 0;
            }
            start = end = -1;
          } else if (code === 61 && start !== -1 && end === -1) {
            paramName = header.slice(start, i);
            start = end = -1;
          } else {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }
        } else {
          if (isEscaping) {
            if (tokenChars[code] !== 1) {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
            if (start === -1) start = i;
            else if (!mustUnescape) mustUnescape = true;
            isEscaping = false;
          } else if (inQuotes) {
            if (tokenChars[code] === 1) {
              if (start === -1) start = i;
            } else if (code === 34 && start !== -1) {
              inQuotes = false;
              end = i;
            } else if (code === 92) {
              isEscaping = true;
            } else {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
          } else if (code === 34 && header.charCodeAt(i - 1) === 61) {
            inQuotes = true;
          } else if (end === -1 && tokenChars[code] === 1) {
            if (start === -1) start = i;
          } else if (start !== -1 && (code === 32 || code === 9)) {
            if (end === -1) end = i;
          } else if (code === 59 || code === 44) {
            if (start === -1) {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
            if (end === -1) end = i;
            let value = header.slice(start, end);
            if (mustUnescape) {
              value = value.replace(/\\/g, "");
              mustUnescape = false;
            }
            push(params, paramName, value);
            if (code === 44) {
              push(offers, extensionName, params);
              params = /* @__PURE__ */ Object.create(null);
              extensionName = void 0;
            }
            paramName = void 0;
            start = end = -1;
          } else {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }
        }
      }
      if (start === -1 || inQuotes || code === 32 || code === 9) {
        throw new SyntaxError("Unexpected end of input");
      }
      if (end === -1) end = i;
      const token = header.slice(start, end);
      if (extensionName === void 0) {
        push(offers, token, params);
      } else {
        if (paramName === void 0) {
          push(params, token, true);
        } else if (mustUnescape) {
          push(params, paramName, token.replace(/\\/g, ""));
        } else {
          push(params, paramName, token);
        }
        push(offers, extensionName, params);
      }
      return offers;
    }
    __name(parse, "parse");
    function format2(extensions) {
      return Object.keys(extensions).map((extension) => {
        let configurations = extensions[extension];
        if (!Array.isArray(configurations)) configurations = [configurations];
        return configurations.map((params) => {
          return [extension].concat(
            Object.keys(params).map((k2) => {
              let values = params[k2];
              if (!Array.isArray(values)) values = [values];
              return values.map((v2) => v2 === true ? k2 : `${k2}=${v2}`).join("; ");
            })
          ).join("; ");
        }).join(", ");
      }).join(", ");
    }
    __name(format2, "format");
    module.exports = { format: format2, parse };
  }
});

// node_modules/.pnpm/ws@8.19.0/node_modules/ws/lib/websocket.js
var require_websocket = __commonJS({
  "node_modules/.pnpm/ws@8.19.0/node_modules/ws/lib/websocket.js"(exports, module) {
    "use strict";
    var EventEmitter = __require("events");
    var https = __require("https");
    var http = __require("http");
    var net = __require("net");
    var tls = __require("tls");
    var { randomBytes: randomBytes3, createHash: createHash3 } = __require("crypto");
    var { Duplex, Readable } = __require("stream");
    var { URL: URL2 } = __require("url");
    var PerMessageDeflate = require_permessage_deflate();
    var Receiver2 = require_receiver();
    var Sender2 = require_sender();
    var { isBlob } = require_validation();
    var {
      BINARY_TYPES,
      CLOSE_TIMEOUT,
      EMPTY_BUFFER,
      GUID,
      kForOnEventAttribute,
      kListener,
      kStatusCode,
      kWebSocket,
      NOOP
    } = require_constants();
    var {
      EventTarget: { addEventListener: addEventListener2, removeEventListener }
    } = require_event_target();
    var { format: format2, parse } = require_extension();
    var { toBuffer } = require_buffer_util();
    var kAborted = Symbol("kAborted");
    var protocolVersions = [8, 13];
    var readyStates = ["CONNECTING", "OPEN", "CLOSING", "CLOSED"];
    var subprotocolRegex = /^[!#$%&'*+\-.0-9A-Z^_`|a-z~]+$/;
    var WebSocket2 = class _WebSocket extends EventEmitter {
      static {
        __name(this, "WebSocket");
      }
      /**
       * Create a new `WebSocket`.
       *
       * @param {(String|URL)} address The URL to which to connect
       * @param {(String|String[])} [protocols] The subprotocols
       * @param {Object} [options] Connection options
       */
      constructor(address, protocols, options) {
        super();
        this._binaryType = BINARY_TYPES[0];
        this._closeCode = 1006;
        this._closeFrameReceived = false;
        this._closeFrameSent = false;
        this._closeMessage = EMPTY_BUFFER;
        this._closeTimer = null;
        this._errorEmitted = false;
        this._extensions = {};
        this._paused = false;
        this._protocol = "";
        this._readyState = _WebSocket.CONNECTING;
        this._receiver = null;
        this._sender = null;
        this._socket = null;
        if (address !== null) {
          this._bufferedAmount = 0;
          this._isServer = false;
          this._redirects = 0;
          if (protocols === void 0) {
            protocols = [];
          } else if (!Array.isArray(protocols)) {
            if (typeof protocols === "object" && protocols !== null) {
              options = protocols;
              protocols = [];
            } else {
              protocols = [protocols];
            }
          }
          initAsClient(this, address, protocols, options);
        } else {
          this._autoPong = options.autoPong;
          this._closeTimeout = options.closeTimeout;
          this._isServer = true;
        }
      }
      /**
       * For historical reasons, the custom "nodebuffer" type is used by the default
       * instead of "blob".
       *
       * @type {String}
       */
      get binaryType() {
        return this._binaryType;
      }
      set binaryType(type) {
        if (!BINARY_TYPES.includes(type)) return;
        this._binaryType = type;
        if (this._receiver) this._receiver._binaryType = type;
      }
      /**
       * @type {Number}
       */
      get bufferedAmount() {
        if (!this._socket) return this._bufferedAmount;
        return this._socket._writableState.length + this._sender._bufferedBytes;
      }
      /**
       * @type {String}
       */
      get extensions() {
        return Object.keys(this._extensions).join();
      }
      /**
       * @type {Boolean}
       */
      get isPaused() {
        return this._paused;
      }
      /**
       * @type {Function}
       */
      /* istanbul ignore next */
      get onclose() {
        return null;
      }
      /**
       * @type {Function}
       */
      /* istanbul ignore next */
      get onerror() {
        return null;
      }
      /**
       * @type {Function}
       */
      /* istanbul ignore next */
      get onopen() {
        return null;
      }
      /**
       * @type {Function}
       */
      /* istanbul ignore next */
      get onmessage() {
        return null;
      }
      /**
       * @type {String}
       */
      get protocol() {
        return this._protocol;
      }
      /**
       * @type {Number}
       */
      get readyState() {
        return this._readyState;
      }
      /**
       * @type {String}
       */
      get url() {
        return this._url;
      }
      /**
       * Set up the socket and the internal resources.
       *
       * @param {Duplex} socket The network socket between the server and client
       * @param {Buffer} head The first packet of the upgraded stream
       * @param {Object} options Options object
       * @param {Boolean} [options.allowSynchronousEvents=false] Specifies whether
       *     any of the `'message'`, `'ping'`, and `'pong'` events can be emitted
       *     multiple times in the same tick
       * @param {Function} [options.generateMask] The function used to generate the
       *     masking key
       * @param {Number} [options.maxPayload=0] The maximum allowed message size
       * @param {Boolean} [options.skipUTF8Validation=false] Specifies whether or
       *     not to skip UTF-8 validation for text and close messages
       * @private
       */
      setSocket(socket, head, options) {
        const receiver = new Receiver2({
          allowSynchronousEvents: options.allowSynchronousEvents,
          binaryType: this.binaryType,
          extensions: this._extensions,
          isServer: this._isServer,
          maxPayload: options.maxPayload,
          skipUTF8Validation: options.skipUTF8Validation
        });
        const sender = new Sender2(socket, this._extensions, options.generateMask);
        this._receiver = receiver;
        this._sender = sender;
        this._socket = socket;
        receiver[kWebSocket] = this;
        sender[kWebSocket] = this;
        socket[kWebSocket] = this;
        receiver.on("conclude", receiverOnConclude);
        receiver.on("drain", receiverOnDrain);
        receiver.on("error", receiverOnError);
        receiver.on("message", receiverOnMessage);
        receiver.on("ping", receiverOnPing);
        receiver.on("pong", receiverOnPong);
        sender.onerror = senderOnError;
        if (socket.setTimeout) socket.setTimeout(0);
        if (socket.setNoDelay) socket.setNoDelay();
        if (head.length > 0) socket.unshift(head);
        socket.on("close", socketOnClose);
        socket.on("data", socketOnData);
        socket.on("end", socketOnEnd);
        socket.on("error", socketOnError);
        this._readyState = _WebSocket.OPEN;
        this.emit("open");
      }
      /**
       * Emit the `'close'` event.
       *
       * @private
       */
      emitClose() {
        if (!this._socket) {
          this._readyState = _WebSocket.CLOSED;
          this.emit("close", this._closeCode, this._closeMessage);
          return;
        }
        if (this._extensions[PerMessageDeflate.extensionName]) {
          this._extensions[PerMessageDeflate.extensionName].cleanup();
        }
        this._receiver.removeAllListeners();
        this._readyState = _WebSocket.CLOSED;
        this.emit("close", this._closeCode, this._closeMessage);
      }
      /**
       * Start a closing handshake.
       *
       *          +----------+   +-----------+   +----------+
       *     - - -|ws.close()|-->|close frame|-->|ws.close()|- - -
       *    |     +----------+   +-----------+   +----------+     |
       *          +----------+   +-----------+         |
       * CLOSING  |ws.close()|<--|close frame|<--+-----+       CLOSING
       *          +----------+   +-----------+   |
       *    |           |                        |   +---+        |
       *                +------------------------+-->|fin| - - - -
       *    |         +---+                      |   +---+
       *     - - - - -|fin|<---------------------+
       *              +---+
       *
       * @param {Number} [code] Status code explaining why the connection is closing
       * @param {(String|Buffer)} [data] The reason why the connection is
       *     closing
       * @public
       */
      close(code, data) {
        if (this.readyState === _WebSocket.CLOSED) return;
        if (this.readyState === _WebSocket.CONNECTING) {
          const msg = "WebSocket was closed before the connection was established";
          abortHandshake(this, this._req, msg);
          return;
        }
        if (this.readyState === _WebSocket.CLOSING) {
          if (this._closeFrameSent && (this._closeFrameReceived || this._receiver._writableState.errorEmitted)) {
            this._socket.end();
          }
          return;
        }
        this._readyState = _WebSocket.CLOSING;
        this._sender.close(code, data, !this._isServer, (err) => {
          if (err) return;
          this._closeFrameSent = true;
          if (this._closeFrameReceived || this._receiver._writableState.errorEmitted) {
            this._socket.end();
          }
        });
        setCloseTimer(this);
      }
      /**
       * Pause the socket.
       *
       * @public
       */
      pause() {
        if (this.readyState === _WebSocket.CONNECTING || this.readyState === _WebSocket.CLOSED) {
          return;
        }
        this._paused = true;
        this._socket.pause();
      }
      /**
       * Send a ping.
       *
       * @param {*} [data] The data to send
       * @param {Boolean} [mask] Indicates whether or not to mask `data`
       * @param {Function} [cb] Callback which is executed when the ping is sent
       * @public
       */
      ping(data, mask, cb) {
        if (this.readyState === _WebSocket.CONNECTING) {
          throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
        }
        if (typeof data === "function") {
          cb = data;
          data = mask = void 0;
        } else if (typeof mask === "function") {
          cb = mask;
          mask = void 0;
        }
        if (typeof data === "number") data = data.toString();
        if (this.readyState !== _WebSocket.OPEN) {
          sendAfterClose(this, data, cb);
          return;
        }
        if (mask === void 0) mask = !this._isServer;
        this._sender.ping(data || EMPTY_BUFFER, mask, cb);
      }
      /**
       * Send a pong.
       *
       * @param {*} [data] The data to send
       * @param {Boolean} [mask] Indicates whether or not to mask `data`
       * @param {Function} [cb] Callback which is executed when the pong is sent
       * @public
       */
      pong(data, mask, cb) {
        if (this.readyState === _WebSocket.CONNECTING) {
          throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
        }
        if (typeof data === "function") {
          cb = data;
          data = mask = void 0;
        } else if (typeof mask === "function") {
          cb = mask;
          mask = void 0;
        }
        if (typeof data === "number") data = data.toString();
        if (this.readyState !== _WebSocket.OPEN) {
          sendAfterClose(this, data, cb);
          return;
        }
        if (mask === void 0) mask = !this._isServer;
        this._sender.pong(data || EMPTY_BUFFER, mask, cb);
      }
      /**
       * Resume the socket.
       *
       * @public
       */
      resume() {
        if (this.readyState === _WebSocket.CONNECTING || this.readyState === _WebSocket.CLOSED) {
          return;
        }
        this._paused = false;
        if (!this._receiver._writableState.needDrain) this._socket.resume();
      }
      /**
       * Send a data message.
       *
       * @param {*} data The message to send
       * @param {Object} [options] Options object
       * @param {Boolean} [options.binary] Specifies whether `data` is binary or
       *     text
       * @param {Boolean} [options.compress] Specifies whether or not to compress
       *     `data`
       * @param {Boolean} [options.fin=true] Specifies whether the fragment is the
       *     last one
       * @param {Boolean} [options.mask] Specifies whether or not to mask `data`
       * @param {Function} [cb] Callback which is executed when data is written out
       * @public
       */
      send(data, options, cb) {
        if (this.readyState === _WebSocket.CONNECTING) {
          throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
        }
        if (typeof options === "function") {
          cb = options;
          options = {};
        }
        if (typeof data === "number") data = data.toString();
        if (this.readyState !== _WebSocket.OPEN) {
          sendAfterClose(this, data, cb);
          return;
        }
        const opts = {
          binary: typeof data !== "string",
          mask: !this._isServer,
          compress: true,
          fin: true,
          ...options
        };
        if (!this._extensions[PerMessageDeflate.extensionName]) {
          opts.compress = false;
        }
        this._sender.send(data || EMPTY_BUFFER, opts, cb);
      }
      /**
       * Forcibly close the connection.
       *
       * @public
       */
      terminate() {
        if (this.readyState === _WebSocket.CLOSED) return;
        if (this.readyState === _WebSocket.CONNECTING) {
          const msg = "WebSocket was closed before the connection was established";
          abortHandshake(this, this._req, msg);
          return;
        }
        if (this._socket) {
          this._readyState = _WebSocket.CLOSING;
          this._socket.destroy();
        }
      }
    };
    Object.defineProperty(WebSocket2, "CONNECTING", {
      enumerable: true,
      value: readyStates.indexOf("CONNECTING")
    });
    Object.defineProperty(WebSocket2.prototype, "CONNECTING", {
      enumerable: true,
      value: readyStates.indexOf("CONNECTING")
    });
    Object.defineProperty(WebSocket2, "OPEN", {
      enumerable: true,
      value: readyStates.indexOf("OPEN")
    });
    Object.defineProperty(WebSocket2.prototype, "OPEN", {
      enumerable: true,
      value: readyStates.indexOf("OPEN")
    });
    Object.defineProperty(WebSocket2, "CLOSING", {
      enumerable: true,
      value: readyStates.indexOf("CLOSING")
    });
    Object.defineProperty(WebSocket2.prototype, "CLOSING", {
      enumerable: true,
      value: readyStates.indexOf("CLOSING")
    });
    Object.defineProperty(WebSocket2, "CLOSED", {
      enumerable: true,
      value: readyStates.indexOf("CLOSED")
    });
    Object.defineProperty(WebSocket2.prototype, "CLOSED", {
      enumerable: true,
      value: readyStates.indexOf("CLOSED")
    });
    [
      "binaryType",
      "bufferedAmount",
      "extensions",
      "isPaused",
      "protocol",
      "readyState",
      "url"
    ].forEach((property) => {
      Object.defineProperty(WebSocket2.prototype, property, { enumerable: true });
    });
    ["open", "error", "close", "message"].forEach((method) => {
      Object.defineProperty(WebSocket2.prototype, `on${method}`, {
        enumerable: true,
        get() {
          for (const listener of this.listeners(method)) {
            if (listener[kForOnEventAttribute]) return listener[kListener];
          }
          return null;
        },
        set(handler2) {
          for (const listener of this.listeners(method)) {
            if (listener[kForOnEventAttribute]) {
              this.removeListener(method, listener);
              break;
            }
          }
          if (typeof handler2 !== "function") return;
          this.addEventListener(method, handler2, {
            [kForOnEventAttribute]: true
          });
        }
      });
    });
    WebSocket2.prototype.addEventListener = addEventListener2;
    WebSocket2.prototype.removeEventListener = removeEventListener;
    module.exports = WebSocket2;
    function initAsClient(websocket, address, protocols, options) {
      const opts = {
        allowSynchronousEvents: true,
        autoPong: true,
        closeTimeout: CLOSE_TIMEOUT,
        protocolVersion: protocolVersions[1],
        maxPayload: 100 * 1024 * 1024,
        skipUTF8Validation: false,
        perMessageDeflate: true,
        followRedirects: false,
        maxRedirects: 10,
        ...options,
        socketPath: void 0,
        hostname: void 0,
        protocol: void 0,
        timeout: void 0,
        method: "GET",
        host: void 0,
        path: void 0,
        port: void 0
      };
      websocket._autoPong = opts.autoPong;
      websocket._closeTimeout = opts.closeTimeout;
      if (!protocolVersions.includes(opts.protocolVersion)) {
        throw new RangeError(
          `Unsupported protocol version: ${opts.protocolVersion} (supported versions: ${protocolVersions.join(", ")})`
        );
      }
      let parsedUrl;
      if (address instanceof URL2) {
        parsedUrl = address;
      } else {
        try {
          parsedUrl = new URL2(address);
        } catch (e) {
          throw new SyntaxError(`Invalid URL: ${address}`);
        }
      }
      if (parsedUrl.protocol === "http:") {
        parsedUrl.protocol = "ws:";
      } else if (parsedUrl.protocol === "https:") {
        parsedUrl.protocol = "wss:";
      }
      websocket._url = parsedUrl.href;
      const isSecure = parsedUrl.protocol === "wss:";
      const isIpcUrl = parsedUrl.protocol === "ws+unix:";
      let invalidUrlMessage;
      if (parsedUrl.protocol !== "ws:" && !isSecure && !isIpcUrl) {
        invalidUrlMessage = `The URL's protocol must be one of "ws:", "wss:", "http:", "https:", or "ws+unix:"`;
      } else if (isIpcUrl && !parsedUrl.pathname) {
        invalidUrlMessage = "The URL's pathname is empty";
      } else if (parsedUrl.hash) {
        invalidUrlMessage = "The URL contains a fragment identifier";
      }
      if (invalidUrlMessage) {
        const err = new SyntaxError(invalidUrlMessage);
        if (websocket._redirects === 0) {
          throw err;
        } else {
          emitErrorAndClose(websocket, err);
          return;
        }
      }
      const defaultPort = isSecure ? 443 : 80;
      const key = randomBytes3(16).toString("base64");
      const request = isSecure ? https.request : http.request;
      const protocolSet = /* @__PURE__ */ new Set();
      let perMessageDeflate;
      opts.createConnection = opts.createConnection || (isSecure ? tlsConnect : netConnect);
      opts.defaultPort = opts.defaultPort || defaultPort;
      opts.port = parsedUrl.port || defaultPort;
      opts.host = parsedUrl.hostname.startsWith("[") ? parsedUrl.hostname.slice(1, -1) : parsedUrl.hostname;
      opts.headers = {
        ...opts.headers,
        "Sec-WebSocket-Version": opts.protocolVersion,
        "Sec-WebSocket-Key": key,
        Connection: "Upgrade",
        Upgrade: "websocket"
      };
      opts.path = parsedUrl.pathname + parsedUrl.search;
      opts.timeout = opts.handshakeTimeout;
      if (opts.perMessageDeflate) {
        perMessageDeflate = new PerMessageDeflate(
          opts.perMessageDeflate !== true ? opts.perMessageDeflate : {},
          false,
          opts.maxPayload
        );
        opts.headers["Sec-WebSocket-Extensions"] = format2({
          [PerMessageDeflate.extensionName]: perMessageDeflate.offer()
        });
      }
      if (protocols.length) {
        for (const protocol of protocols) {
          if (typeof protocol !== "string" || !subprotocolRegex.test(protocol) || protocolSet.has(protocol)) {
            throw new SyntaxError(
              "An invalid or duplicated subprotocol was specified"
            );
          }
          protocolSet.add(protocol);
        }
        opts.headers["Sec-WebSocket-Protocol"] = protocols.join(",");
      }
      if (opts.origin) {
        if (opts.protocolVersion < 13) {
          opts.headers["Sec-WebSocket-Origin"] = opts.origin;
        } else {
          opts.headers.Origin = opts.origin;
        }
      }
      if (parsedUrl.username || parsedUrl.password) {
        opts.auth = `${parsedUrl.username}:${parsedUrl.password}`;
      }
      if (isIpcUrl) {
        const parts = opts.path.split(":");
        opts.socketPath = parts[0];
        opts.path = parts[1];
      }
      let req;
      if (opts.followRedirects) {
        if (websocket._redirects === 0) {
          websocket._originalIpc = isIpcUrl;
          websocket._originalSecure = isSecure;
          websocket._originalHostOrSocketPath = isIpcUrl ? opts.socketPath : parsedUrl.host;
          const headers = options && options.headers;
          options = { ...options, headers: {} };
          if (headers) {
            for (const [key2, value] of Object.entries(headers)) {
              options.headers[key2.toLowerCase()] = value;
            }
          }
        } else if (websocket.listenerCount("redirect") === 0) {
          const isSameHost = isIpcUrl ? websocket._originalIpc ? opts.socketPath === websocket._originalHostOrSocketPath : false : websocket._originalIpc ? false : parsedUrl.host === websocket._originalHostOrSocketPath;
          if (!isSameHost || websocket._originalSecure && !isSecure) {
            delete opts.headers.authorization;
            delete opts.headers.cookie;
            if (!isSameHost) delete opts.headers.host;
            opts.auth = void 0;
          }
        }
        if (opts.auth && !options.headers.authorization) {
          options.headers.authorization = "Basic " + Buffer.from(opts.auth).toString("base64");
        }
        req = websocket._req = request(opts);
        if (websocket._redirects) {
          websocket.emit("redirect", websocket.url, req);
        }
      } else {
        req = websocket._req = request(opts);
      }
      if (opts.timeout) {
        req.on("timeout", () => {
          abortHandshake(websocket, req, "Opening handshake has timed out");
        });
      }
      req.on("error", (err) => {
        if (req === null || req[kAborted]) return;
        req = websocket._req = null;
        emitErrorAndClose(websocket, err);
      });
      req.on("response", (res) => {
        const location = res.headers.location;
        const statusCode = res.statusCode;
        if (location && opts.followRedirects && statusCode >= 300 && statusCode < 400) {
          if (++websocket._redirects > opts.maxRedirects) {
            abortHandshake(websocket, req, "Maximum redirects exceeded");
            return;
          }
          req.abort();
          let addr;
          try {
            addr = new URL2(location, address);
          } catch (e) {
            const err = new SyntaxError(`Invalid URL: ${location}`);
            emitErrorAndClose(websocket, err);
            return;
          }
          initAsClient(websocket, addr, protocols, options);
        } else if (!websocket.emit("unexpected-response", req, res)) {
          abortHandshake(
            websocket,
            req,
            `Unexpected server response: ${res.statusCode}`
          );
        }
      });
      req.on("upgrade", (res, socket, head) => {
        websocket.emit("upgrade", res);
        if (websocket.readyState !== WebSocket2.CONNECTING) return;
        req = websocket._req = null;
        const upgrade = res.headers.upgrade;
        if (upgrade === void 0 || upgrade.toLowerCase() !== "websocket") {
          abortHandshake(websocket, socket, "Invalid Upgrade header");
          return;
        }
        const digest = createHash3("sha1").update(key + GUID).digest("base64");
        if (res.headers["sec-websocket-accept"] !== digest) {
          abortHandshake(websocket, socket, "Invalid Sec-WebSocket-Accept header");
          return;
        }
        const serverProt = res.headers["sec-websocket-protocol"];
        let protError;
        if (serverProt !== void 0) {
          if (!protocolSet.size) {
            protError = "Server sent a subprotocol but none was requested";
          } else if (!protocolSet.has(serverProt)) {
            protError = "Server sent an invalid subprotocol";
          }
        } else if (protocolSet.size) {
          protError = "Server sent no subprotocol";
        }
        if (protError) {
          abortHandshake(websocket, socket, protError);
          return;
        }
        if (serverProt) websocket._protocol = serverProt;
        const secWebSocketExtensions = res.headers["sec-websocket-extensions"];
        if (secWebSocketExtensions !== void 0) {
          if (!perMessageDeflate) {
            const message2 = "Server sent a Sec-WebSocket-Extensions header but no extension was requested";
            abortHandshake(websocket, socket, message2);
            return;
          }
          let extensions;
          try {
            extensions = parse(secWebSocketExtensions);
          } catch (err) {
            const message2 = "Invalid Sec-WebSocket-Extensions header";
            abortHandshake(websocket, socket, message2);
            return;
          }
          const extensionNames = Object.keys(extensions);
          if (extensionNames.length !== 1 || extensionNames[0] !== PerMessageDeflate.extensionName) {
            const message2 = "Server indicated an extension that was not requested";
            abortHandshake(websocket, socket, message2);
            return;
          }
          try {
            perMessageDeflate.accept(extensions[PerMessageDeflate.extensionName]);
          } catch (err) {
            const message2 = "Invalid Sec-WebSocket-Extensions header";
            abortHandshake(websocket, socket, message2);
            return;
          }
          websocket._extensions[PerMessageDeflate.extensionName] = perMessageDeflate;
        }
        websocket.setSocket(socket, head, {
          allowSynchronousEvents: opts.allowSynchronousEvents,
          generateMask: opts.generateMask,
          maxPayload: opts.maxPayload,
          skipUTF8Validation: opts.skipUTF8Validation
        });
      });
      if (opts.finishRequest) {
        opts.finishRequest(req, websocket);
      } else {
        req.end();
      }
    }
    __name(initAsClient, "initAsClient");
    function emitErrorAndClose(websocket, err) {
      websocket._readyState = WebSocket2.CLOSING;
      websocket._errorEmitted = true;
      websocket.emit("error", err);
      websocket.emitClose();
    }
    __name(emitErrorAndClose, "emitErrorAndClose");
    function netConnect(options) {
      options.path = options.socketPath;
      return net.connect(options);
    }
    __name(netConnect, "netConnect");
    function tlsConnect(options) {
      options.path = void 0;
      if (!options.servername && options.servername !== "") {
        options.servername = net.isIP(options.host) ? "" : options.host;
      }
      return tls.connect(options);
    }
    __name(tlsConnect, "tlsConnect");
    function abortHandshake(websocket, stream2, message2) {
      websocket._readyState = WebSocket2.CLOSING;
      const err = new Error(message2);
      Error.captureStackTrace(err, abortHandshake);
      if (stream2.setHeader) {
        stream2[kAborted] = true;
        stream2.abort();
        if (stream2.socket && !stream2.socket.destroyed) {
          stream2.socket.destroy();
        }
        process.nextTick(emitErrorAndClose, websocket, err);
      } else {
        stream2.destroy(err);
        stream2.once("error", websocket.emit.bind(websocket, "error"));
        stream2.once("close", websocket.emitClose.bind(websocket));
      }
    }
    __name(abortHandshake, "abortHandshake");
    function sendAfterClose(websocket, data, cb) {
      if (data) {
        const length = isBlob(data) ? data.size : toBuffer(data).length;
        if (websocket._socket) websocket._sender._bufferedBytes += length;
        else websocket._bufferedAmount += length;
      }
      if (cb) {
        const err = new Error(
          `WebSocket is not open: readyState ${websocket.readyState} (${readyStates[websocket.readyState]})`
        );
        process.nextTick(cb, err);
      }
    }
    __name(sendAfterClose, "sendAfterClose");
    function receiverOnConclude(code, reason) {
      const websocket = this[kWebSocket];
      websocket._closeFrameReceived = true;
      websocket._closeMessage = reason;
      websocket._closeCode = code;
      if (websocket._socket[kWebSocket] === void 0) return;
      websocket._socket.removeListener("data", socketOnData);
      process.nextTick(resume, websocket._socket);
      if (code === 1005) websocket.close();
      else websocket.close(code, reason);
    }
    __name(receiverOnConclude, "receiverOnConclude");
    function receiverOnDrain() {
      const websocket = this[kWebSocket];
      if (!websocket.isPaused) websocket._socket.resume();
    }
    __name(receiverOnDrain, "receiverOnDrain");
    function receiverOnError(err) {
      const websocket = this[kWebSocket];
      if (websocket._socket[kWebSocket] !== void 0) {
        websocket._socket.removeListener("data", socketOnData);
        process.nextTick(resume, websocket._socket);
        websocket.close(err[kStatusCode]);
      }
      if (!websocket._errorEmitted) {
        websocket._errorEmitted = true;
        websocket.emit("error", err);
      }
    }
    __name(receiverOnError, "receiverOnError");
    function receiverOnFinish() {
      this[kWebSocket].emitClose();
    }
    __name(receiverOnFinish, "receiverOnFinish");
    function receiverOnMessage(data, isBinary) {
      this[kWebSocket].emit("message", data, isBinary);
    }
    __name(receiverOnMessage, "receiverOnMessage");
    function receiverOnPing(data) {
      const websocket = this[kWebSocket];
      if (websocket._autoPong) websocket.pong(data, !this._isServer, NOOP);
      websocket.emit("ping", data);
    }
    __name(receiverOnPing, "receiverOnPing");
    function receiverOnPong(data) {
      this[kWebSocket].emit("pong", data);
    }
    __name(receiverOnPong, "receiverOnPong");
    function resume(stream2) {
      stream2.resume();
    }
    __name(resume, "resume");
    function senderOnError(err) {
      const websocket = this[kWebSocket];
      if (websocket.readyState === WebSocket2.CLOSED) return;
      if (websocket.readyState === WebSocket2.OPEN) {
        websocket._readyState = WebSocket2.CLOSING;
        setCloseTimer(websocket);
      }
      this._socket.end();
      if (!websocket._errorEmitted) {
        websocket._errorEmitted = true;
        websocket.emit("error", err);
      }
    }
    __name(senderOnError, "senderOnError");
    function setCloseTimer(websocket) {
      websocket._closeTimer = setTimeout(
        websocket._socket.destroy.bind(websocket._socket),
        websocket._closeTimeout
      );
    }
    __name(setCloseTimer, "setCloseTimer");
    function socketOnClose() {
      const websocket = this[kWebSocket];
      this.removeListener("close", socketOnClose);
      this.removeListener("data", socketOnData);
      this.removeListener("end", socketOnEnd);
      websocket._readyState = WebSocket2.CLOSING;
      if (!this._readableState.endEmitted && !websocket._closeFrameReceived && !websocket._receiver._writableState.errorEmitted && this._readableState.length !== 0) {
        const chunk = this.read(this._readableState.length);
        websocket._receiver.write(chunk);
      }
      websocket._receiver.end();
      this[kWebSocket] = void 0;
      clearTimeout(websocket._closeTimer);
      if (websocket._receiver._writableState.finished || websocket._receiver._writableState.errorEmitted) {
        websocket.emitClose();
      } else {
        websocket._receiver.on("error", receiverOnFinish);
        websocket._receiver.on("finish", receiverOnFinish);
      }
    }
    __name(socketOnClose, "socketOnClose");
    function socketOnData(chunk) {
      if (!this[kWebSocket]._receiver.write(chunk)) {
        this.pause();
      }
    }
    __name(socketOnData, "socketOnData");
    function socketOnEnd() {
      const websocket = this[kWebSocket];
      websocket._readyState = WebSocket2.CLOSING;
      websocket._receiver.end();
      this.end();
    }
    __name(socketOnEnd, "socketOnEnd");
    function socketOnError() {
      const websocket = this[kWebSocket];
      this.removeListener("error", socketOnError);
      this.on("error", NOOP);
      if (websocket) {
        websocket._readyState = WebSocket2.CLOSING;
        this.destroy();
      }
    }
    __name(socketOnError, "socketOnError");
  }
});

// node_modules/.pnpm/ws@8.19.0/node_modules/ws/lib/stream.js
var require_stream = __commonJS({
  "node_modules/.pnpm/ws@8.19.0/node_modules/ws/lib/stream.js"(exports, module) {
    "use strict";
    var WebSocket2 = require_websocket();
    var { Duplex } = __require("stream");
    function emitClose(stream2) {
      stream2.emit("close");
    }
    __name(emitClose, "emitClose");
    function duplexOnEnd() {
      if (!this.destroyed && this._writableState.finished) {
        this.destroy();
      }
    }
    __name(duplexOnEnd, "duplexOnEnd");
    function duplexOnError(err) {
      this.removeListener("error", duplexOnError);
      this.destroy();
      if (this.listenerCount("error") === 0) {
        this.emit("error", err);
      }
    }
    __name(duplexOnError, "duplexOnError");
    function createWebSocketStream2(ws, options) {
      let terminateOnDestroy = true;
      const duplex = new Duplex({
        ...options,
        autoDestroy: false,
        emitClose: false,
        objectMode: false,
        writableObjectMode: false
      });
      ws.on("message", /* @__PURE__ */ __name(function message2(msg, isBinary) {
        const data = !isBinary && duplex._readableState.objectMode ? msg.toString() : msg;
        if (!duplex.push(data)) ws.pause();
      }, "message"));
      ws.once("error", /* @__PURE__ */ __name(function error(err) {
        if (duplex.destroyed) return;
        terminateOnDestroy = false;
        duplex.destroy(err);
      }, "error"));
      ws.once("close", /* @__PURE__ */ __name(function close() {
        if (duplex.destroyed) return;
        duplex.push(null);
      }, "close"));
      duplex._destroy = function(err, callback) {
        if (ws.readyState === ws.CLOSED) {
          callback(err);
          process.nextTick(emitClose, duplex);
          return;
        }
        let called = false;
        ws.once("error", /* @__PURE__ */ __name(function error(err2) {
          called = true;
          callback(err2);
        }, "error"));
        ws.once("close", /* @__PURE__ */ __name(function close() {
          if (!called) callback(err);
          process.nextTick(emitClose, duplex);
        }, "close"));
        if (terminateOnDestroy) ws.terminate();
      };
      duplex._final = function(callback) {
        if (ws.readyState === ws.CONNECTING) {
          ws.once("open", /* @__PURE__ */ __name(function open() {
            duplex._final(callback);
          }, "open"));
          return;
        }
        if (ws._socket === null) return;
        if (ws._socket._writableState.finished) {
          callback();
          if (duplex._readableState.endEmitted) duplex.destroy();
        } else {
          ws._socket.once("finish", /* @__PURE__ */ __name(function finish() {
            callback();
          }, "finish"));
          ws.close();
        }
      };
      duplex._read = function() {
        if (ws.isPaused) ws.resume();
      };
      duplex._write = function(chunk, encoding, callback) {
        if (ws.readyState === ws.CONNECTING) {
          ws.once("open", /* @__PURE__ */ __name(function open() {
            duplex._write(chunk, encoding, callback);
          }, "open"));
          return;
        }
        ws.send(chunk, callback);
      };
      duplex.on("end", duplexOnEnd);
      duplex.on("error", duplexOnError);
      return duplex;
    }
    __name(createWebSocketStream2, "createWebSocketStream");
    module.exports = createWebSocketStream2;
  }
});

// node_modules/.pnpm/ws@8.19.0/node_modules/ws/lib/subprotocol.js
var require_subprotocol = __commonJS({
  "node_modules/.pnpm/ws@8.19.0/node_modules/ws/lib/subprotocol.js"(exports, module) {
    "use strict";
    var { tokenChars } = require_validation();
    function parse(header) {
      const protocols = /* @__PURE__ */ new Set();
      let start = -1;
      let end = -1;
      let i = 0;
      for (i; i < header.length; i++) {
        const code = header.charCodeAt(i);
        if (end === -1 && tokenChars[code] === 1) {
          if (start === -1) start = i;
        } else if (i !== 0 && (code === 32 || code === 9)) {
          if (end === -1 && start !== -1) end = i;
        } else if (code === 44) {
          if (start === -1) {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }
          if (end === -1) end = i;
          const protocol2 = header.slice(start, end);
          if (protocols.has(protocol2)) {
            throw new SyntaxError(`The "${protocol2}" subprotocol is duplicated`);
          }
          protocols.add(protocol2);
          start = end = -1;
        } else {
          throw new SyntaxError(`Unexpected character at index ${i}`);
        }
      }
      if (start === -1 || end !== -1) {
        throw new SyntaxError("Unexpected end of input");
      }
      const protocol = header.slice(start, i);
      if (protocols.has(protocol)) {
        throw new SyntaxError(`The "${protocol}" subprotocol is duplicated`);
      }
      protocols.add(protocol);
      return protocols;
    }
    __name(parse, "parse");
    module.exports = { parse };
  }
});

// node_modules/.pnpm/ws@8.19.0/node_modules/ws/lib/websocket-server.js
var require_websocket_server = __commonJS({
  "node_modules/.pnpm/ws@8.19.0/node_modules/ws/lib/websocket-server.js"(exports, module) {
    "use strict";
    var EventEmitter = __require("events");
    var http = __require("http");
    var { Duplex } = __require("stream");
    var { createHash: createHash3 } = __require("crypto");
    var extension = require_extension();
    var PerMessageDeflate = require_permessage_deflate();
    var subprotocol = require_subprotocol();
    var WebSocket2 = require_websocket();
    var { CLOSE_TIMEOUT, GUID, kWebSocket } = require_constants();
    var keyRegex = /^[+/0-9A-Za-z]{22}==$/;
    var RUNNING = 0;
    var CLOSING = 1;
    var CLOSED = 2;
    var WebSocketServer2 = class extends EventEmitter {
      static {
        __name(this, "WebSocketServer");
      }
      /**
       * Create a `WebSocketServer` instance.
       *
       * @param {Object} options Configuration options
       * @param {Boolean} [options.allowSynchronousEvents=true] Specifies whether
       *     any of the `'message'`, `'ping'`, and `'pong'` events can be emitted
       *     multiple times in the same tick
       * @param {Boolean} [options.autoPong=true] Specifies whether or not to
       *     automatically send a pong in response to a ping
       * @param {Number} [options.backlog=511] The maximum length of the queue of
       *     pending connections
       * @param {Boolean} [options.clientTracking=true] Specifies whether or not to
       *     track clients
       * @param {Number} [options.closeTimeout=30000] Duration in milliseconds to
       *     wait for the closing handshake to finish after `websocket.close()` is
       *     called
       * @param {Function} [options.handleProtocols] A hook to handle protocols
       * @param {String} [options.host] The hostname where to bind the server
       * @param {Number} [options.maxPayload=104857600] The maximum allowed message
       *     size
       * @param {Boolean} [options.noServer=false] Enable no server mode
       * @param {String} [options.path] Accept only connections matching this path
       * @param {(Boolean|Object)} [options.perMessageDeflate=false] Enable/disable
       *     permessage-deflate
       * @param {Number} [options.port] The port where to bind the server
       * @param {(http.Server|https.Server)} [options.server] A pre-created HTTP/S
       *     server to use
       * @param {Boolean} [options.skipUTF8Validation=false] Specifies whether or
       *     not to skip UTF-8 validation for text and close messages
       * @param {Function} [options.verifyClient] A hook to reject connections
       * @param {Function} [options.WebSocket=WebSocket] Specifies the `WebSocket`
       *     class to use. It must be the `WebSocket` class or class that extends it
       * @param {Function} [callback] A listener for the `listening` event
       */
      constructor(options, callback) {
        super();
        options = {
          allowSynchronousEvents: true,
          autoPong: true,
          maxPayload: 100 * 1024 * 1024,
          skipUTF8Validation: false,
          perMessageDeflate: false,
          handleProtocols: null,
          clientTracking: true,
          closeTimeout: CLOSE_TIMEOUT,
          verifyClient: null,
          noServer: false,
          backlog: null,
          // use default (511 as implemented in net.js)
          server: null,
          host: null,
          path: null,
          port: null,
          WebSocket: WebSocket2,
          ...options
        };
        if (options.port == null && !options.server && !options.noServer || options.port != null && (options.server || options.noServer) || options.server && options.noServer) {
          throw new TypeError(
            'One and only one of the "port", "server", or "noServer" options must be specified'
          );
        }
        if (options.port != null) {
          this._server = http.createServer((req, res) => {
            const body = http.STATUS_CODES[426];
            res.writeHead(426, {
              "Content-Length": body.length,
              "Content-Type": "text/plain"
            });
            res.end(body);
          });
          this._server.listen(
            options.port,
            options.host,
            options.backlog,
            callback
          );
        } else if (options.server) {
          this._server = options.server;
        }
        if (this._server) {
          const emitConnection = this.emit.bind(this, "connection");
          this._removeListeners = addListeners(this._server, {
            listening: this.emit.bind(this, "listening"),
            error: this.emit.bind(this, "error"),
            upgrade: /* @__PURE__ */ __name((req, socket, head) => {
              this.handleUpgrade(req, socket, head, emitConnection);
            }, "upgrade")
          });
        }
        if (options.perMessageDeflate === true) options.perMessageDeflate = {};
        if (options.clientTracking) {
          this.clients = /* @__PURE__ */ new Set();
          this._shouldEmitClose = false;
        }
        this.options = options;
        this._state = RUNNING;
      }
      /**
       * Returns the bound address, the address family name, and port of the server
       * as reported by the operating system if listening on an IP socket.
       * If the server is listening on a pipe or UNIX domain socket, the name is
       * returned as a string.
       *
       * @return {(Object|String|null)} The address of the server
       * @public
       */
      address() {
        if (this.options.noServer) {
          throw new Error('The server is operating in "noServer" mode');
        }
        if (!this._server) return null;
        return this._server.address();
      }
      /**
       * Stop the server from accepting new connections and emit the `'close'` event
       * when all existing connections are closed.
       *
       * @param {Function} [cb] A one-time listener for the `'close'` event
       * @public
       */
      close(cb) {
        if (this._state === CLOSED) {
          if (cb) {
            this.once("close", () => {
              cb(new Error("The server is not running"));
            });
          }
          process.nextTick(emitClose, this);
          return;
        }
        if (cb) this.once("close", cb);
        if (this._state === CLOSING) return;
        this._state = CLOSING;
        if (this.options.noServer || this.options.server) {
          if (this._server) {
            this._removeListeners();
            this._removeListeners = this._server = null;
          }
          if (this.clients) {
            if (!this.clients.size) {
              process.nextTick(emitClose, this);
            } else {
              this._shouldEmitClose = true;
            }
          } else {
            process.nextTick(emitClose, this);
          }
        } else {
          const server = this._server;
          this._removeListeners();
          this._removeListeners = this._server = null;
          server.close(() => {
            emitClose(this);
          });
        }
      }
      /**
       * See if a given request should be handled by this server instance.
       *
       * @param {http.IncomingMessage} req Request object to inspect
       * @return {Boolean} `true` if the request is valid, else `false`
       * @public
       */
      shouldHandle(req) {
        if (this.options.path) {
          const index2 = req.url.indexOf("?");
          const pathname = index2 !== -1 ? req.url.slice(0, index2) : req.url;
          if (pathname !== this.options.path) return false;
        }
        return true;
      }
      /**
       * Handle a HTTP Upgrade request.
       *
       * @param {http.IncomingMessage} req The request object
       * @param {Duplex} socket The network socket between the server and client
       * @param {Buffer} head The first packet of the upgraded stream
       * @param {Function} cb Callback
       * @public
       */
      handleUpgrade(req, socket, head, cb) {
        socket.on("error", socketOnError);
        const key = req.headers["sec-websocket-key"];
        const upgrade = req.headers.upgrade;
        const version2 = +req.headers["sec-websocket-version"];
        if (req.method !== "GET") {
          const message2 = "Invalid HTTP method";
          abortHandshakeOrEmitwsClientError(this, req, socket, 405, message2);
          return;
        }
        if (upgrade === void 0 || upgrade.toLowerCase() !== "websocket") {
          const message2 = "Invalid Upgrade header";
          abortHandshakeOrEmitwsClientError(this, req, socket, 400, message2);
          return;
        }
        if (key === void 0 || !keyRegex.test(key)) {
          const message2 = "Missing or invalid Sec-WebSocket-Key header";
          abortHandshakeOrEmitwsClientError(this, req, socket, 400, message2);
          return;
        }
        if (version2 !== 13 && version2 !== 8) {
          const message2 = "Missing or invalid Sec-WebSocket-Version header";
          abortHandshakeOrEmitwsClientError(this, req, socket, 400, message2, {
            "Sec-WebSocket-Version": "13, 8"
          });
          return;
        }
        if (!this.shouldHandle(req)) {
          abortHandshake(socket, 400);
          return;
        }
        const secWebSocketProtocol = req.headers["sec-websocket-protocol"];
        let protocols = /* @__PURE__ */ new Set();
        if (secWebSocketProtocol !== void 0) {
          try {
            protocols = subprotocol.parse(secWebSocketProtocol);
          } catch (err) {
            const message2 = "Invalid Sec-WebSocket-Protocol header";
            abortHandshakeOrEmitwsClientError(this, req, socket, 400, message2);
            return;
          }
        }
        const secWebSocketExtensions = req.headers["sec-websocket-extensions"];
        const extensions = {};
        if (this.options.perMessageDeflate && secWebSocketExtensions !== void 0) {
          const perMessageDeflate = new PerMessageDeflate(
            this.options.perMessageDeflate,
            true,
            this.options.maxPayload
          );
          try {
            const offers = extension.parse(secWebSocketExtensions);
            if (offers[PerMessageDeflate.extensionName]) {
              perMessageDeflate.accept(offers[PerMessageDeflate.extensionName]);
              extensions[PerMessageDeflate.extensionName] = perMessageDeflate;
            }
          } catch (err) {
            const message2 = "Invalid or unacceptable Sec-WebSocket-Extensions header";
            abortHandshakeOrEmitwsClientError(this, req, socket, 400, message2);
            return;
          }
        }
        if (this.options.verifyClient) {
          const info = {
            origin: req.headers[`${version2 === 8 ? "sec-websocket-origin" : "origin"}`],
            secure: !!(req.socket.authorized || req.socket.encrypted),
            req
          };
          if (this.options.verifyClient.length === 2) {
            this.options.verifyClient(info, (verified, code, message2, headers) => {
              if (!verified) {
                return abortHandshake(socket, code || 401, message2, headers);
              }
              this.completeUpgrade(
                extensions,
                key,
                protocols,
                req,
                socket,
                head,
                cb
              );
            });
            return;
          }
          if (!this.options.verifyClient(info)) return abortHandshake(socket, 401);
        }
        this.completeUpgrade(extensions, key, protocols, req, socket, head, cb);
      }
      /**
       * Upgrade the connection to WebSocket.
       *
       * @param {Object} extensions The accepted extensions
       * @param {String} key The value of the `Sec-WebSocket-Key` header
       * @param {Set} protocols The subprotocols
       * @param {http.IncomingMessage} req The request object
       * @param {Duplex} socket The network socket between the server and client
       * @param {Buffer} head The first packet of the upgraded stream
       * @param {Function} cb Callback
       * @throws {Error} If called more than once with the same socket
       * @private
       */
      completeUpgrade(extensions, key, protocols, req, socket, head, cb) {
        if (!socket.readable || !socket.writable) return socket.destroy();
        if (socket[kWebSocket]) {
          throw new Error(
            "server.handleUpgrade() was called more than once with the same socket, possibly due to a misconfiguration"
          );
        }
        if (this._state > RUNNING) return abortHandshake(socket, 503);
        const digest = createHash3("sha1").update(key + GUID).digest("base64");
        const headers = [
          "HTTP/1.1 101 Switching Protocols",
          "Upgrade: websocket",
          "Connection: Upgrade",
          `Sec-WebSocket-Accept: ${digest}`
        ];
        const ws = new this.options.WebSocket(null, void 0, this.options);
        if (protocols.size) {
          const protocol = this.options.handleProtocols ? this.options.handleProtocols(protocols, req) : protocols.values().next().value;
          if (protocol) {
            headers.push(`Sec-WebSocket-Protocol: ${protocol}`);
            ws._protocol = protocol;
          }
        }
        if (extensions[PerMessageDeflate.extensionName]) {
          const params = extensions[PerMessageDeflate.extensionName].params;
          const value = extension.format({
            [PerMessageDeflate.extensionName]: [params]
          });
          headers.push(`Sec-WebSocket-Extensions: ${value}`);
          ws._extensions = extensions;
        }
        this.emit("headers", headers, req);
        socket.write(headers.concat("\r\n").join("\r\n"));
        socket.removeListener("error", socketOnError);
        ws.setSocket(socket, head, {
          allowSynchronousEvents: this.options.allowSynchronousEvents,
          maxPayload: this.options.maxPayload,
          skipUTF8Validation: this.options.skipUTF8Validation
        });
        if (this.clients) {
          this.clients.add(ws);
          ws.on("close", () => {
            this.clients.delete(ws);
            if (this._shouldEmitClose && !this.clients.size) {
              process.nextTick(emitClose, this);
            }
          });
        }
        cb(ws, req);
      }
    };
    module.exports = WebSocketServer2;
    function addListeners(server, map) {
      for (const event of Object.keys(map)) server.on(event, map[event]);
      return /* @__PURE__ */ __name(function removeListeners() {
        for (const event of Object.keys(map)) {
          server.removeListener(event, map[event]);
        }
      }, "removeListeners");
    }
    __name(addListeners, "addListeners");
    function emitClose(server) {
      server._state = CLOSED;
      server.emit("close");
    }
    __name(emitClose, "emitClose");
    function socketOnError() {
      this.destroy();
    }
    __name(socketOnError, "socketOnError");
    function abortHandshake(socket, code, message2, headers) {
      message2 = message2 || http.STATUS_CODES[code];
      headers = {
        Connection: "close",
        "Content-Type": "text/html",
        "Content-Length": Buffer.byteLength(message2),
        ...headers
      };
      socket.once("finish", socket.destroy);
      socket.end(
        `HTTP/1.1 ${code} ${http.STATUS_CODES[code]}\r
` + Object.keys(headers).map((h) => `${h}: ${headers[h]}`).join("\r\n") + "\r\n\r\n" + message2
      );
    }
    __name(abortHandshake, "abortHandshake");
    function abortHandshakeOrEmitwsClientError(server, req, socket, code, message2, headers) {
      if (server.listenerCount("wsClientError")) {
        const err = new Error(message2);
        Error.captureStackTrace(err, abortHandshakeOrEmitwsClientError);
        server.emit("wsClientError", err, socket, req);
      } else {
        abortHandshake(socket, code, message2, headers);
      }
    }
    __name(abortHandshakeOrEmitwsClientError, "abortHandshakeOrEmitwsClientError");
  }
});

// apps/api/src/lib/scrape-events.ts
var scrape_events_exports = {};
__export(scrape_events_exports, {
  addConnection: () => addConnection,
  addExtensionConnection: () => addExtensionConnection,
  assignTaskToExtension: () => assignTaskToExtension,
  broadcastTaskUpdate: () => broadcastTaskUpdate,
  emitTaskUpdate: () => emitTaskUpdate,
  getStats: () => getStats,
  hasExtensionConnected: () => hasExtensionConnected,
  notifyTaskCallback: () => notifyTaskCallback,
  removeConnection: () => removeConnection,
  removeExtensionConnection: () => removeExtensionConnection,
  sendToUser: () => sendToUser,
  subscribeToTask: () => subscribeToTask,
  taskCallbacks: () => taskCallbacks,
  unsubscribeFromTask: () => unsubscribeFromTask,
  waitForTask: () => waitForTask
});
function addConnection(userId, ws) {
  if (!userConnections.has(userId)) {
    userConnections.set(userId, /* @__PURE__ */ new Set());
  }
  userConnections.get(userId).add(ws);
  console.log(`[WS] User ${userId} connected. Total connections: ${userConnections.get(userId).size}`);
}
function removeConnection(userId, ws) {
  const connections = userConnections.get(userId);
  if (connections) {
    connections.delete(ws);
    if (connections.size === 0) {
      userConnections.delete(userId);
    }
    console.log(`[WS] User ${userId} disconnected. Remaining: ${connections?.size || 0}`);
  }
}
function addExtensionConnection(userId, ws) {
  if (!extensionConnections.has(userId)) {
    extensionConnections.set(userId, /* @__PURE__ */ new Set());
  }
  extensionConnections.get(userId).add(ws);
  console.log(`[WS] Extension for user ${userId} connected. Total: ${extensionConnections.get(userId).size}`);
}
function removeExtensionConnection(userId, ws) {
  const connections = extensionConnections.get(userId);
  if (connections) {
    connections.delete(ws);
    if (connections.size === 0) {
      extensionConnections.delete(userId);
    }
    console.log(`[WS] Extension for user ${userId} disconnected. Remaining: ${connections?.size || 0}`);
  }
}
function hasExtensionConnected(userId) {
  const connections = extensionConnections.get(userId);
  return connections !== void 0 && connections.size > 0;
}
function assignTaskToExtension(userId, task) {
  const connections = extensionConnections.get(userId);
  if (!connections || connections.size === 0) {
    return false;
  }
  const ws = connections.values().next().value;
  if (!ws) {
    return false;
  }
  const message2 = {
    type: "task_assigned",
    task
  };
  try {
    ws.send(JSON.stringify(message2));
    console.log(`[WS] Task ${task.id} assigned to extension for user ${userId}`);
    return true;
  } catch (err) {
    console.error(`[WS] Failed to assign task to extension:`, err);
    return false;
  }
}
function subscribeToTask(userId, taskId) {
  if (!taskWaiters.has(taskId)) {
    taskWaiters.set(taskId, /* @__PURE__ */ new Set());
  }
  taskWaiters.get(taskId).add(userId);
}
function unsubscribeFromTask(userId, taskId) {
  const waiters = taskWaiters.get(taskId);
  if (waiters) {
    waiters.delete(userId);
    if (waiters.size === 0) {
      taskWaiters.delete(taskId);
    }
  }
}
function broadcastTaskUpdate(taskId, event) {
  const waiters = taskWaiters.get(taskId);
  if (!waiters || waiters.size === 0) {
    return;
  }
  const message2 = JSON.stringify(event);
  for (const userId of waiters) {
    const connections = userConnections.get(userId);
    if (connections) {
      for (const ws of connections) {
        try {
          ws.send(message2);
        } catch (err) {
          console.error(`[WS] Failed to send to user ${userId}:`, err);
        }
      }
    }
  }
  if (["completed", "failed", "expired"].includes(event.status)) {
    taskWaiters.delete(taskId);
  }
}
function sendToUser(userId, message2) {
  const connections = userConnections.get(userId);
  if (!connections) return;
  const data = typeof message2 === "string" ? message2 : JSON.stringify(message2);
  for (const ws of connections) {
    try {
      ws.send(data);
    } catch (err) {
      console.error(`[WS] Failed to send to user ${userId}:`, err);
    }
  }
}
function waitForTask(userId, taskId, timeoutMs = 12e4) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      unsubscribeFromTask(userId, taskId);
      reject(new Error("Task wait timeout"));
    }, timeoutMs);
    subscribeToTask(userId, taskId);
    const checkUpdate = /* @__PURE__ */ __name((event) => {
      if (event.taskId === taskId && ["completed", "failed", "expired"].includes(event.status)) {
        clearTimeout(timeout);
        unsubscribeFromTask(userId, taskId);
        resolve(event);
      }
    }, "checkUpdate");
    taskCallbacks.set(`${userId}:${taskId}`, checkUpdate);
  });
}
function notifyTaskCallback(taskId, event) {
  const waiters = taskWaiters.get(taskId);
  if (!waiters) return;
  for (const userId of waiters) {
    const key = `${userId}:${taskId}`;
    const callback = taskCallbacks.get(key);
    if (callback) {
      callback(event);
      taskCallbacks.delete(key);
    }
  }
}
function emitTaskUpdate(taskId, event) {
  broadcastTaskUpdate(taskId, event);
  notifyTaskCallback(taskId, event);
}
function getStats() {
  let totalConnections = 0;
  for (const connections of userConnections.values()) {
    totalConnections += connections.size;
  }
  let totalExtensions = 0;
  for (const connections of extensionConnections.values()) {
    totalExtensions += connections.size;
  }
  return {
    users: userConnections.size,
    connections: totalConnections,
    extensions: totalExtensions,
    pendingTasks: taskWaiters.size
  };
}
var userConnections, extensionConnections, taskWaiters, taskCallbacks;
var init_scrape_events = __esm({
  "apps/api/src/lib/scrape-events.ts"() {
    "use strict";
    userConnections = /* @__PURE__ */ new Map();
    extensionConnections = /* @__PURE__ */ new Map();
    taskWaiters = /* @__PURE__ */ new Map();
    __name(addConnection, "addConnection");
    __name(removeConnection, "removeConnection");
    __name(addExtensionConnection, "addExtensionConnection");
    __name(removeExtensionConnection, "removeExtensionConnection");
    __name(hasExtensionConnected, "hasExtensionConnected");
    __name(assignTaskToExtension, "assignTaskToExtension");
    __name(subscribeToTask, "subscribeToTask");
    __name(unsubscribeFromTask, "unsubscribeFromTask");
    __name(broadcastTaskUpdate, "broadcastTaskUpdate");
    __name(sendToUser, "sendToUser");
    __name(waitForTask, "waitForTask");
    taskCallbacks = /* @__PURE__ */ new Map();
    __name(notifyTaskCallback, "notifyTaskCallback");
    __name(emitTaskUpdate, "emitTaskUpdate");
    __name(getStats, "getStats");
  }
});

// node_modules/.pnpm/hono@4.11.4/node_modules/hono/dist/utils/encode.js
var encodeBase64 = /* @__PURE__ */ __name((buf) => {
  let binary = "";
  const bytes = new Uint8Array(buf);
  for (let i = 0, len = bytes.length; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}, "encodeBase64");
var decodeBase64 = /* @__PURE__ */ __name((str) => {
  const binary = atob(str);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  const half = binary.length / 2;
  for (let i = 0, j2 = binary.length - 1; i <= half; i++, j2--) {
    bytes[i] = binary.charCodeAt(i);
    bytes[j2] = binary.charCodeAt(j2);
  }
  return bytes;
}, "decodeBase64");

// node_modules/.pnpm/hono@4.11.4/node_modules/hono/dist/adapter/aws-lambda/handler.js
function sanitizeHeaderValue(value) {
  const hasNonAscii = /[^\x00-\x7F]/.test(value);
  if (!hasNonAscii) {
    return value;
  }
  return encodeURIComponent(value);
}
__name(sanitizeHeaderValue, "sanitizeHeaderValue");
var getRequestContext = /* @__PURE__ */ __name((event) => {
  return event.requestContext;
}, "getRequestContext");
var handle = /* @__PURE__ */ __name((app2, { isContentTypeBinary } = { isContentTypeBinary: void 0 }) => {
  return async (event, lambdaContext) => {
    const processor = getProcessor(event);
    const req = processor.createRequest(event);
    const requestContext = getRequestContext(event);
    const res = await app2.fetch(req, {
      event,
      requestContext,
      lambdaContext
    });
    return processor.createResult(event, res, { isContentTypeBinary });
  };
}, "handle");
var EventProcessor = class {
  static {
    __name(this, "EventProcessor");
  }
  getHeaderValue(headers, key) {
    const value = headers ? Array.isArray(headers[key]) ? headers[key][0] : headers[key] : void 0;
    return value;
  }
  getDomainName(event) {
    if (event.requestContext && "domainName" in event.requestContext) {
      return event.requestContext.domainName;
    }
    const hostFromHeaders = this.getHeaderValue(event.headers, "host");
    if (hostFromHeaders) {
      return hostFromHeaders;
    }
    const multiValueHeaders = "multiValueHeaders" in event ? event.multiValueHeaders : {};
    const hostFromMultiValueHeaders = this.getHeaderValue(multiValueHeaders, "host");
    return hostFromMultiValueHeaders;
  }
  createRequest(event) {
    const queryString = this.getQueryString(event);
    const domainName = this.getDomainName(event);
    const path = this.getPath(event);
    const urlPath = `https://${domainName}${path}`;
    const url = queryString ? `${urlPath}?${queryString}` : urlPath;
    const headers = this.getHeaders(event);
    const method = this.getMethod(event);
    const requestInit = {
      headers,
      method
    };
    if (event.body) {
      requestInit.body = event.isBase64Encoded ? decodeBase64(event.body) : event.body;
    }
    return new Request(url, requestInit);
  }
  async createResult(event, res, options) {
    const contentType = res.headers.get("content-type");
    const isContentTypeBinary = options.isContentTypeBinary ?? defaultIsContentTypeBinary;
    let isBase64Encoded = contentType && isContentTypeBinary(contentType) ? true : false;
    if (!isBase64Encoded) {
      const contentEncoding = res.headers.get("content-encoding");
      isBase64Encoded = isContentEncodingBinary(contentEncoding);
    }
    const body = isBase64Encoded ? encodeBase64(await res.arrayBuffer()) : await res.text();
    const result = {
      body,
      statusCode: res.status,
      isBase64Encoded,
      ..."multiValueHeaders" in event && event.multiValueHeaders ? {
        multiValueHeaders: {}
      } : {
        headers: {}
      }
    };
    this.setCookies(event, res, result);
    if (result.multiValueHeaders) {
      res.headers.forEach((value, key) => {
        result.multiValueHeaders[key] = [value];
      });
    } else {
      res.headers.forEach((value, key) => {
        result.headers[key] = value;
      });
    }
    return result;
  }
  setCookies(event, res, result) {
    if (res.headers.has("set-cookie")) {
      const cookies = res.headers.getSetCookie ? res.headers.getSetCookie() : Array.from(res.headers.entries()).filter(([k2]) => k2 === "set-cookie").map(([, v2]) => v2);
      if (Array.isArray(cookies)) {
        this.setCookiesToResult(result, cookies);
        res.headers.delete("set-cookie");
      }
    }
  }
};
var EventV2Processor = class extends EventProcessor {
  static {
    __name(this, "EventV2Processor");
  }
  getPath(event) {
    return event.rawPath;
  }
  getMethod(event) {
    return event.requestContext.http.method;
  }
  getQueryString(event) {
    return event.rawQueryString;
  }
  getCookies(event, headers) {
    if (Array.isArray(event.cookies)) {
      headers.set("Cookie", event.cookies.join("; "));
    }
  }
  setCookiesToResult(result, cookies) {
    result.cookies = cookies;
  }
  getHeaders(event) {
    const headers = new Headers();
    this.getCookies(event, headers);
    if (event.headers) {
      for (const [k2, v2] of Object.entries(event.headers)) {
        if (v2) {
          headers.set(k2, v2);
        }
      }
    }
    return headers;
  }
};
var v2Processor = new EventV2Processor();
var EventV1Processor = class extends EventProcessor {
  static {
    __name(this, "EventV1Processor");
  }
  getPath(event) {
    return event.path;
  }
  getMethod(event) {
    return event.httpMethod;
  }
  getQueryString(event) {
    if (event.multiValueQueryStringParameters) {
      return Object.entries(event.multiValueQueryStringParameters || {}).filter(([, value]) => value).map(
        ([key, values]) => values.map((value) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`).join("&")
      ).join("&");
    } else {
      return Object.entries(event.queryStringParameters || {}).filter(([, value]) => value).map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value || "")}`).join("&");
    }
  }
  getCookies(event, headers) {
  }
  getHeaders(event) {
    const headers = new Headers();
    this.getCookies(event, headers);
    if (event.headers) {
      for (const [k2, v2] of Object.entries(event.headers)) {
        if (v2) {
          headers.set(k2, sanitizeHeaderValue(v2));
        }
      }
    }
    if (event.multiValueHeaders) {
      for (const [k2, values] of Object.entries(event.multiValueHeaders)) {
        if (values) {
          const foundK = headers.get(k2);
          values.forEach((v2) => {
            const sanitizedValue = sanitizeHeaderValue(v2);
            return (!foundK || !foundK.includes(sanitizedValue)) && headers.append(k2, sanitizedValue);
          });
        }
      }
    }
    return headers;
  }
  setCookiesToResult(result, cookies) {
    result.multiValueHeaders = {
      "set-cookie": cookies
    };
  }
};
var v1Processor = new EventV1Processor();
var ALBProcessor = class extends EventProcessor {
  static {
    __name(this, "ALBProcessor");
  }
  getHeaders(event) {
    const headers = new Headers();
    if (event.multiValueHeaders) {
      for (const [key, values] of Object.entries(event.multiValueHeaders)) {
        if (values && Array.isArray(values)) {
          const sanitizedValue = sanitizeHeaderValue(values.join("; "));
          headers.set(key, sanitizedValue);
        }
      }
    } else {
      for (const [key, value] of Object.entries(event.headers ?? {})) {
        if (value) {
          headers.set(key, sanitizeHeaderValue(value));
        }
      }
    }
    return headers;
  }
  getPath(event) {
    return event.path;
  }
  getMethod(event) {
    return event.httpMethod;
  }
  getQueryString(event) {
    if (event.multiValueQueryStringParameters) {
      return Object.entries(event.multiValueQueryStringParameters || {}).filter(([, value]) => value).map(([key, value]) => `${key}=${value.join(`&${key}=`)}`).join("&");
    } else {
      return Object.entries(event.queryStringParameters || {}).filter(([, value]) => value).map(([key, value]) => `${key}=${value}`).join("&");
    }
  }
  getCookies(event, headers) {
    let cookie;
    if (event.multiValueHeaders) {
      cookie = event.multiValueHeaders["cookie"]?.join("; ");
    } else {
      cookie = event.headers ? event.headers["cookie"] : void 0;
    }
    if (cookie) {
      headers.append("Cookie", cookie);
    }
  }
  setCookiesToResult(result, cookies) {
    if (result.multiValueHeaders) {
      result.multiValueHeaders["set-cookie"] = cookies;
    } else {
      result.headers["set-cookie"] = cookies.join(", ");
    }
  }
};
var albProcessor = new ALBProcessor();
var LatticeV2Processor = class extends EventProcessor {
  static {
    __name(this, "LatticeV2Processor");
  }
  getPath(event) {
    return event.path;
  }
  getMethod(event) {
    return event.method;
  }
  getQueryString() {
    return "";
  }
  getHeaders(event) {
    const headers = new Headers();
    if (event.headers) {
      for (const [k2, values] of Object.entries(event.headers)) {
        if (values) {
          const foundK = headers.get(k2);
          values.forEach((v2) => {
            const sanitizedValue = sanitizeHeaderValue(v2);
            return (!foundK || !foundK.includes(sanitizedValue)) && headers.append(k2, sanitizedValue);
          });
        }
      }
    }
    return headers;
  }
  getCookies() {
  }
  setCookiesToResult(result, cookies) {
    result.headers = {
      ...result.headers,
      "set-cookie": cookies.join(", ")
    };
  }
};
var latticeV2Processor = new LatticeV2Processor();
var getProcessor = /* @__PURE__ */ __name((event) => {
  if (isProxyEventALB(event)) {
    return albProcessor;
  }
  if (isProxyEventV2(event)) {
    return v2Processor;
  }
  if (isLatticeEventV2(event)) {
    return latticeV2Processor;
  }
  return v1Processor;
}, "getProcessor");
var isProxyEventALB = /* @__PURE__ */ __name((event) => {
  if (event.requestContext) {
    return Object.hasOwn(event.requestContext, "elb");
  }
  return false;
}, "isProxyEventALB");
var isProxyEventV2 = /* @__PURE__ */ __name((event) => {
  return Object.hasOwn(event, "rawPath");
}, "isProxyEventV2");
var isLatticeEventV2 = /* @__PURE__ */ __name((event) => {
  if (event.requestContext) {
    return Object.hasOwn(event.requestContext, "serviceArn");
  }
  return false;
}, "isLatticeEventV2");
var defaultIsContentTypeBinary = /* @__PURE__ */ __name((contentType) => {
  return !/^text\/(?:plain|html|css|javascript|csv)|(?:\/|\+)(?:json|xml)\s*(?:;|$)/.test(
    contentType
  );
}, "defaultIsContentTypeBinary");
var isContentEncodingBinary = /* @__PURE__ */ __name((contentEncoding) => {
  if (contentEncoding === null) {
    return false;
  }
  return /^(gzip|deflate|compress|br)/.test(contentEncoding);
}, "isContentEncodingBinary");

// node_modules/.pnpm/sst@3.17.25/node_modules/sst/dist/resource.js
import { env } from "process";
import { readFileSync } from "fs";
import crypto2 from "crypto";
var raw = {
  // @ts-expect-error,
  ...globalThis.$SST_LINKS
};
var environment = {
  ...env,
  ...globalThis.process?.env
};
if (environment.SST_RESOURCES_JSON) {
  try {
    const allResources = JSON.parse(environment.SST_RESOURCES_JSON);
    Object.assign(raw, allResources);
  } catch (error) {
    console.error("Failed to parse SST_RESOURCES_JSON:", error);
  }
}
for (const [key, value] of Object.entries(environment)) {
  if (key.startsWith("SST_RESOURCE_") && value) {
    raw[key.slice("SST_RESOURCE_".length)] = JSON.parse(value);
  }
}
if (env.SST_KEY_FILE && env.SST_KEY && !globalThis.SST_KEY_FILE_DATA) {
  const key = Buffer.from(env.SST_KEY, "base64");
  const encryptedData = readFileSync(env.SST_KEY_FILE);
  const nonce = Buffer.alloc(12, 0);
  const decipher = crypto2.createDecipheriv("aes-256-gcm", key, nonce);
  const authTag = encryptedData.subarray(-16);
  const actualCiphertext = encryptedData.subarray(0, -16);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(actualCiphertext);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  const decryptedData = JSON.parse(decrypted.toString());
  Object.assign(raw, decryptedData);
}
if (globalThis.SST_KEY_FILE_DATA) {
  Object.assign(raw, globalThis.SST_KEY_FILE_DATA);
}
var Resource = new Proxy(raw, {
  get(_target, prop) {
    if (prop in raw) {
      return raw[prop];
    }
    if (!env.SST_RESOURCE_App) {
      throw new Error("It does not look like SST links are active. If this is in local development and you are not starting this process through the multiplexer, wrap your command with `sst dev -- <command>`");
    }
    let msg = `"${prop}" is not linked in your sst.config.ts`;
    if (env.AWS_LAMBDA_FUNCTION_NAME) {
      msg += ` to ${env.AWS_LAMBDA_FUNCTION_NAME}`;
    }
    throw new Error(msg);
  }
});

// node_modules/.pnpm/sst@3.17.25/node_modules/sst/dist/index.js
import { format } from "util";
if (process.env?.ECS_CONTAINER_METADATA_URI_V4 && !process.env.SST_DISABLE_LOG_POLYFILL) {
  const log2 = /* @__PURE__ */ __name((level) => (msg, ...rest) => {
    let line = `${level}	${format(msg, ...rest)}`;
    line = line.replace(/\n/g, "\r");
    process.stdout.write(line + "\n");
  }, "log");
  console.log = log2("INFO");
  console.warn = log2("WARN");
  console.error = log2("ERROR");
  console.trace = log2("TRACE");
  console.debug = log2("DEBUG");
}

// node_modules/.pnpm/hono@4.11.4/node_modules/hono/dist/compose.js
var compose = /* @__PURE__ */ __name((middleware, onError, onNotFound) => {
  return (context, next) => {
    let index2 = -1;
    return dispatch(0);
    async function dispatch(i) {
      if (i <= index2) {
        throw new Error("next() called multiple times");
      }
      index2 = i;
      let res;
      let isError = false;
      let handler2;
      if (middleware[i]) {
        handler2 = middleware[i][0][0];
        context.req.routeIndex = i;
      } else {
        handler2 = i === middleware.length && next || void 0;
      }
      if (handler2) {
        try {
          res = await handler2(context, () => dispatch(i + 1));
        } catch (err) {
          if (err instanceof Error && onError) {
            context.error = err;
            res = await onError(err, context);
            isError = true;
          } else {
            throw err;
          }
        }
      } else {
        if (context.finalized === false && onNotFound) {
          res = await onNotFound(context);
        }
      }
      if (res && (context.finalized === false || isError)) {
        context.res = res;
      }
      return context;
    }
    __name(dispatch, "dispatch");
  };
}, "compose");

// node_modules/.pnpm/hono@4.11.4/node_modules/hono/dist/request/constants.js
var GET_MATCH_RESULT = /* @__PURE__ */ Symbol();

// node_modules/.pnpm/hono@4.11.4/node_modules/hono/dist/utils/body.js
var parseBody = /* @__PURE__ */ __name(async (request, options = /* @__PURE__ */ Object.create(null)) => {
  const { all = false, dot = false } = options;
  const headers = request instanceof HonoRequest ? request.raw.headers : request.headers;
  const contentType = headers.get("Content-Type");
  if (contentType?.startsWith("multipart/form-data") || contentType?.startsWith("application/x-www-form-urlencoded")) {
    return parseFormData(request, { all, dot });
  }
  return {};
}, "parseBody");
async function parseFormData(request, options) {
  const formData = await request.formData();
  if (formData) {
    return convertFormDataToBodyData(formData, options);
  }
  return {};
}
__name(parseFormData, "parseFormData");
function convertFormDataToBodyData(formData, options) {
  const form = /* @__PURE__ */ Object.create(null);
  formData.forEach((value, key) => {
    const shouldParseAllValues = options.all || key.endsWith("[]");
    if (!shouldParseAllValues) {
      form[key] = value;
    } else {
      handleParsingAllValues(form, key, value);
    }
  });
  if (options.dot) {
    Object.entries(form).forEach(([key, value]) => {
      const shouldParseDotValues = key.includes(".");
      if (shouldParseDotValues) {
        handleParsingNestedValues(form, key, value);
        delete form[key];
      }
    });
  }
  return form;
}
__name(convertFormDataToBodyData, "convertFormDataToBodyData");
var handleParsingAllValues = /* @__PURE__ */ __name((form, key, value) => {
  if (form[key] !== void 0) {
    if (Array.isArray(form[key])) {
      ;
      form[key].push(value);
    } else {
      form[key] = [form[key], value];
    }
  } else {
    if (!key.endsWith("[]")) {
      form[key] = value;
    } else {
      form[key] = [value];
    }
  }
}, "handleParsingAllValues");
var handleParsingNestedValues = /* @__PURE__ */ __name((form, key, value) => {
  let nestedForm = form;
  const keys = key.split(".");
  keys.forEach((key2, index2) => {
    if (index2 === keys.length - 1) {
      nestedForm[key2] = value;
    } else {
      if (!nestedForm[key2] || typeof nestedForm[key2] !== "object" || Array.isArray(nestedForm[key2]) || nestedForm[key2] instanceof File) {
        nestedForm[key2] = /* @__PURE__ */ Object.create(null);
      }
      nestedForm = nestedForm[key2];
    }
  });
}, "handleParsingNestedValues");

// node_modules/.pnpm/hono@4.11.4/node_modules/hono/dist/utils/url.js
var splitPath = /* @__PURE__ */ __name((path) => {
  const paths = path.split("/");
  if (paths[0] === "") {
    paths.shift();
  }
  return paths;
}, "splitPath");
var splitRoutingPath = /* @__PURE__ */ __name((routePath) => {
  const { groups, path } = extractGroupsFromPath(routePath);
  const paths = splitPath(path);
  return replaceGroupMarks(paths, groups);
}, "splitRoutingPath");
var extractGroupsFromPath = /* @__PURE__ */ __name((path) => {
  const groups = [];
  path = path.replace(/\{[^}]+\}/g, (match2, index2) => {
    const mark = `@${index2}`;
    groups.push([mark, match2]);
    return mark;
  });
  return { groups, path };
}, "extractGroupsFromPath");
var replaceGroupMarks = /* @__PURE__ */ __name((paths, groups) => {
  for (let i = groups.length - 1; i >= 0; i--) {
    const [mark] = groups[i];
    for (let j2 = paths.length - 1; j2 >= 0; j2--) {
      if (paths[j2].includes(mark)) {
        paths[j2] = paths[j2].replace(mark, groups[i][1]);
        break;
      }
    }
  }
  return paths;
}, "replaceGroupMarks");
var patternCache = {};
var getPattern = /* @__PURE__ */ __name((label, next) => {
  if (label === "*") {
    return "*";
  }
  const match2 = label.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
  if (match2) {
    const cacheKey = `${label}#${next}`;
    if (!patternCache[cacheKey]) {
      if (match2[2]) {
        patternCache[cacheKey] = next && next[0] !== ":" && next[0] !== "*" ? [cacheKey, match2[1], new RegExp(`^${match2[2]}(?=/${next})`)] : [label, match2[1], new RegExp(`^${match2[2]}$`)];
      } else {
        patternCache[cacheKey] = [label, match2[1], true];
      }
    }
    return patternCache[cacheKey];
  }
  return null;
}, "getPattern");
var tryDecode = /* @__PURE__ */ __name((str, decoder2) => {
  try {
    return decoder2(str);
  } catch {
    return str.replace(/(?:%[0-9A-Fa-f]{2})+/g, (match2) => {
      try {
        return decoder2(match2);
      } catch {
        return match2;
      }
    });
  }
}, "tryDecode");
var tryDecodeURI = /* @__PURE__ */ __name((str) => tryDecode(str, decodeURI), "tryDecodeURI");
var getPath = /* @__PURE__ */ __name((request) => {
  const url = request.url;
  const start = url.indexOf("/", url.indexOf(":") + 4);
  let i = start;
  for (; i < url.length; i++) {
    const charCode = url.charCodeAt(i);
    if (charCode === 37) {
      const queryIndex = url.indexOf("?", i);
      const path = url.slice(start, queryIndex === -1 ? void 0 : queryIndex);
      return tryDecodeURI(path.includes("%25") ? path.replace(/%25/g, "%2525") : path);
    } else if (charCode === 63) {
      break;
    }
  }
  return url.slice(start, i);
}, "getPath");
var getPathNoStrict = /* @__PURE__ */ __name((request) => {
  const result = getPath(request);
  return result.length > 1 && result.at(-1) === "/" ? result.slice(0, -1) : result;
}, "getPathNoStrict");
var mergePath = /* @__PURE__ */ __name((base, sub, ...rest) => {
  if (rest.length) {
    sub = mergePath(sub, ...rest);
  }
  return `${base?.[0] === "/" ? "" : "/"}${base}${sub === "/" ? "" : `${base?.at(-1) === "/" ? "" : "/"}${sub?.[0] === "/" ? sub.slice(1) : sub}`}`;
}, "mergePath");
var checkOptionalParameter = /* @__PURE__ */ __name((path) => {
  if (path.charCodeAt(path.length - 1) !== 63 || !path.includes(":")) {
    return null;
  }
  const segments = path.split("/");
  const results = [];
  let basePath = "";
  segments.forEach((segment) => {
    if (segment !== "" && !/\:/.test(segment)) {
      basePath += "/" + segment;
    } else if (/\:/.test(segment)) {
      if (/\?/.test(segment)) {
        if (results.length === 0 && basePath === "") {
          results.push("/");
        } else {
          results.push(basePath);
        }
        const optionalSegment = segment.replace("?", "");
        basePath += "/" + optionalSegment;
        results.push(basePath);
      } else {
        basePath += "/" + segment;
      }
    }
  });
  return results.filter((v2, i, a) => a.indexOf(v2) === i);
}, "checkOptionalParameter");
var _decodeURI = /* @__PURE__ */ __name((value) => {
  if (!/[%+]/.test(value)) {
    return value;
  }
  if (value.indexOf("+") !== -1) {
    value = value.replace(/\+/g, " ");
  }
  return value.indexOf("%") !== -1 ? tryDecode(value, decodeURIComponent_) : value;
}, "_decodeURI");
var _getQueryParam = /* @__PURE__ */ __name((url, key, multiple) => {
  let encoded;
  if (!multiple && key && !/[%+]/.test(key)) {
    let keyIndex2 = url.indexOf("?", 8);
    if (keyIndex2 === -1) {
      return void 0;
    }
    if (!url.startsWith(key, keyIndex2 + 1)) {
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    while (keyIndex2 !== -1) {
      const trailingKeyCode = url.charCodeAt(keyIndex2 + key.length + 1);
      if (trailingKeyCode === 61) {
        const valueIndex = keyIndex2 + key.length + 2;
        const endIndex = url.indexOf("&", valueIndex);
        return _decodeURI(url.slice(valueIndex, endIndex === -1 ? void 0 : endIndex));
      } else if (trailingKeyCode == 38 || isNaN(trailingKeyCode)) {
        return "";
      }
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    encoded = /[%+]/.test(url);
    if (!encoded) {
      return void 0;
    }
  }
  const results = {};
  encoded ??= /[%+]/.test(url);
  let keyIndex = url.indexOf("?", 8);
  while (keyIndex !== -1) {
    const nextKeyIndex = url.indexOf("&", keyIndex + 1);
    let valueIndex = url.indexOf("=", keyIndex);
    if (valueIndex > nextKeyIndex && nextKeyIndex !== -1) {
      valueIndex = -1;
    }
    let name = url.slice(
      keyIndex + 1,
      valueIndex === -1 ? nextKeyIndex === -1 ? void 0 : nextKeyIndex : valueIndex
    );
    if (encoded) {
      name = _decodeURI(name);
    }
    keyIndex = nextKeyIndex;
    if (name === "") {
      continue;
    }
    let value;
    if (valueIndex === -1) {
      value = "";
    } else {
      value = url.slice(valueIndex + 1, nextKeyIndex === -1 ? void 0 : nextKeyIndex);
      if (encoded) {
        value = _decodeURI(value);
      }
    }
    if (multiple) {
      if (!(results[name] && Array.isArray(results[name]))) {
        results[name] = [];
      }
      ;
      results[name].push(value);
    } else {
      results[name] ??= value;
    }
  }
  return key ? results[key] : results;
}, "_getQueryParam");
var getQueryParam = _getQueryParam;
var getQueryParams = /* @__PURE__ */ __name((url, key) => {
  return _getQueryParam(url, key, true);
}, "getQueryParams");
var decodeURIComponent_ = decodeURIComponent;

// node_modules/.pnpm/hono@4.11.4/node_modules/hono/dist/request.js
var tryDecodeURIComponent = /* @__PURE__ */ __name((str) => tryDecode(str, decodeURIComponent_), "tryDecodeURIComponent");
var HonoRequest = class {
  static {
    __name(this, "HonoRequest");
  }
  /**
   * `.raw` can get the raw Request object.
   *
   * @see {@link https://hono.dev/docs/api/request#raw}
   *
   * @example
   * ```ts
   * // For Cloudflare Workers
   * app.post('/', async (c) => {
   *   const metadata = c.req.raw.cf?.hostMetadata?
   *   ...
   * })
   * ```
   */
  raw;
  #validatedData;
  // Short name of validatedData
  #matchResult;
  routeIndex = 0;
  /**
   * `.path` can get the pathname of the request.
   *
   * @see {@link https://hono.dev/docs/api/request#path}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const pathname = c.req.path // `/about/me`
   * })
   * ```
   */
  path;
  bodyCache = {};
  constructor(request, path = "/", matchResult = [[]]) {
    this.raw = request;
    this.path = path;
    this.#matchResult = matchResult;
    this.#validatedData = {};
  }
  param(key) {
    return key ? this.#getDecodedParam(key) : this.#getAllDecodedParams();
  }
  #getDecodedParam(key) {
    const paramKey = this.#matchResult[0][this.routeIndex][1][key];
    const param = this.#getParamValue(paramKey);
    return param && /\%/.test(param) ? tryDecodeURIComponent(param) : param;
  }
  #getAllDecodedParams() {
    const decoded = {};
    const keys = Object.keys(this.#matchResult[0][this.routeIndex][1]);
    for (const key of keys) {
      const value = this.#getParamValue(this.#matchResult[0][this.routeIndex][1][key]);
      if (value !== void 0) {
        decoded[key] = /\%/.test(value) ? tryDecodeURIComponent(value) : value;
      }
    }
    return decoded;
  }
  #getParamValue(paramKey) {
    return this.#matchResult[1] ? this.#matchResult[1][paramKey] : paramKey;
  }
  query(key) {
    return getQueryParam(this.url, key);
  }
  queries(key) {
    return getQueryParams(this.url, key);
  }
  header(name) {
    if (name) {
      return this.raw.headers.get(name) ?? void 0;
    }
    const headerData = {};
    this.raw.headers.forEach((value, key) => {
      headerData[key] = value;
    });
    return headerData;
  }
  async parseBody(options) {
    return this.bodyCache.parsedBody ??= await parseBody(this, options);
  }
  #cachedBody = /* @__PURE__ */ __name((key) => {
    const { bodyCache, raw: raw3 } = this;
    const cachedBody = bodyCache[key];
    if (cachedBody) {
      return cachedBody;
    }
    const anyCachedKey = Object.keys(bodyCache)[0];
    if (anyCachedKey) {
      return bodyCache[anyCachedKey].then((body) => {
        if (anyCachedKey === "json") {
          body = JSON.stringify(body);
        }
        return new Response(body)[key]();
      });
    }
    return bodyCache[key] = raw3[key]();
  }, "#cachedBody");
  /**
   * `.json()` can parse Request body of type `application/json`
   *
   * @see {@link https://hono.dev/docs/api/request#json}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.json()
   * })
   * ```
   */
  json() {
    return this.#cachedBody("text").then((text2) => JSON.parse(text2));
  }
  /**
   * `.text()` can parse Request body of type `text/plain`
   *
   * @see {@link https://hono.dev/docs/api/request#text}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.text()
   * })
   * ```
   */
  text() {
    return this.#cachedBody("text");
  }
  /**
   * `.arrayBuffer()` parse Request body as an `ArrayBuffer`
   *
   * @see {@link https://hono.dev/docs/api/request#arraybuffer}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.arrayBuffer()
   * })
   * ```
   */
  arrayBuffer() {
    return this.#cachedBody("arrayBuffer");
  }
  /**
   * Parses the request body as a `Blob`.
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.blob();
   * });
   * ```
   * @see https://hono.dev/docs/api/request#blob
   */
  blob() {
    return this.#cachedBody("blob");
  }
  /**
   * Parses the request body as `FormData`.
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.formData();
   * });
   * ```
   * @see https://hono.dev/docs/api/request#formdata
   */
  formData() {
    return this.#cachedBody("formData");
  }
  /**
   * Adds validated data to the request.
   *
   * @param target - The target of the validation.
   * @param data - The validated data to add.
   */
  addValidatedData(target, data) {
    this.#validatedData[target] = data;
  }
  valid(target) {
    return this.#validatedData[target];
  }
  /**
   * `.url()` can get the request url strings.
   *
   * @see {@link https://hono.dev/docs/api/request#url}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const url = c.req.url // `http://localhost:8787/about/me`
   *   ...
   * })
   * ```
   */
  get url() {
    return this.raw.url;
  }
  /**
   * `.method()` can get the method name of the request.
   *
   * @see {@link https://hono.dev/docs/api/request#method}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const method = c.req.method // `GET`
   * })
   * ```
   */
  get method() {
    return this.raw.method;
  }
  get [GET_MATCH_RESULT]() {
    return this.#matchResult;
  }
  /**
   * `.matchedRoutes()` can return a matched route in the handler
   *
   * @deprecated
   *
   * Use matchedRoutes helper defined in "hono/route" instead.
   *
   * @see {@link https://hono.dev/docs/api/request#matchedroutes}
   *
   * @example
   * ```ts
   * app.use('*', async function logger(c, next) {
   *   await next()
   *   c.req.matchedRoutes.forEach(({ handler, method, path }, i) => {
   *     const name = handler.name || (handler.length < 2 ? '[handler]' : '[middleware]')
   *     console.log(
   *       method,
   *       ' ',
   *       path,
   *       ' '.repeat(Math.max(10 - path.length, 0)),
   *       name,
   *       i === c.req.routeIndex ? '<- respond from here' : ''
   *     )
   *   })
   * })
   * ```
   */
  get matchedRoutes() {
    return this.#matchResult[0].map(([[, route]]) => route);
  }
  /**
   * `routePath()` can retrieve the path registered within the handler
   *
   * @deprecated
   *
   * Use routePath helper defined in "hono/route" instead.
   *
   * @see {@link https://hono.dev/docs/api/request#routepath}
   *
   * @example
   * ```ts
   * app.get('/posts/:id', (c) => {
   *   return c.json({ path: c.req.routePath })
   * })
   * ```
   */
  get routePath() {
    return this.#matchResult[0].map(([[, route]]) => route)[this.routeIndex].path;
  }
};

// node_modules/.pnpm/hono@4.11.4/node_modules/hono/dist/utils/html.js
var HtmlEscapedCallbackPhase = {
  Stringify: 1,
  BeforeStream: 2,
  Stream: 3
};
var raw2 = /* @__PURE__ */ __name((value, callbacks) => {
  const escapedString = new String(value);
  escapedString.isEscaped = true;
  escapedString.callbacks = callbacks;
  return escapedString;
}, "raw");
var resolveCallback = /* @__PURE__ */ __name(async (str, phase, preserveCallbacks, context, buffer) => {
  if (typeof str === "object" && !(str instanceof String)) {
    if (!(str instanceof Promise)) {
      str = str.toString();
    }
    if (str instanceof Promise) {
      str = await str;
    }
  }
  const callbacks = str.callbacks;
  if (!callbacks?.length) {
    return Promise.resolve(str);
  }
  if (buffer) {
    buffer[0] += str;
  } else {
    buffer = [str];
  }
  const resStr = Promise.all(callbacks.map((c) => c({ phase, buffer, context }))).then(
    (res) => Promise.all(
      res.filter(Boolean).map((str2) => resolveCallback(str2, phase, false, context, buffer))
    ).then(() => buffer[0])
  );
  if (preserveCallbacks) {
    return raw2(await resStr, callbacks);
  } else {
    return resStr;
  }
}, "resolveCallback");

// node_modules/.pnpm/hono@4.11.4/node_modules/hono/dist/context.js
var TEXT_PLAIN = "text/plain; charset=UTF-8";
var setDefaultContentType = /* @__PURE__ */ __name((contentType, headers) => {
  return {
    "Content-Type": contentType,
    ...headers
  };
}, "setDefaultContentType");
var Context = class {
  static {
    __name(this, "Context");
  }
  #rawRequest;
  #req;
  /**
   * `.env` can get bindings (environment variables, secrets, KV namespaces, D1 database, R2 bucket etc.) in Cloudflare Workers.
   *
   * @see {@link https://hono.dev/docs/api/context#env}
   *
   * @example
   * ```ts
   * // Environment object for Cloudflare Workers
   * app.get('*', async c => {
   *   const counter = c.env.COUNTER
   * })
   * ```
   */
  env = {};
  #var;
  finalized = false;
  /**
   * `.error` can get the error object from the middleware if the Handler throws an error.
   *
   * @see {@link https://hono.dev/docs/api/context#error}
   *
   * @example
   * ```ts
   * app.use('*', async (c, next) => {
   *   await next()
   *   if (c.error) {
   *     // do something...
   *   }
   * })
   * ```
   */
  error;
  #status;
  #executionCtx;
  #res;
  #layout;
  #renderer;
  #notFoundHandler;
  #preparedHeaders;
  #matchResult;
  #path;
  /**
   * Creates an instance of the Context class.
   *
   * @param req - The Request object.
   * @param options - Optional configuration options for the context.
   */
  constructor(req, options) {
    this.#rawRequest = req;
    if (options) {
      this.#executionCtx = options.executionCtx;
      this.env = options.env;
      this.#notFoundHandler = options.notFoundHandler;
      this.#path = options.path;
      this.#matchResult = options.matchResult;
    }
  }
  /**
   * `.req` is the instance of {@link HonoRequest}.
   */
  get req() {
    this.#req ??= new HonoRequest(this.#rawRequest, this.#path, this.#matchResult);
    return this.#req;
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#event}
   * The FetchEvent associated with the current request.
   *
   * @throws Will throw an error if the context does not have a FetchEvent.
   */
  get event() {
    if (this.#executionCtx && "respondWith" in this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no FetchEvent");
    }
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#executionctx}
   * The ExecutionContext associated with the current request.
   *
   * @throws Will throw an error if the context does not have an ExecutionContext.
   */
  get executionCtx() {
    if (this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no ExecutionContext");
    }
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#res}
   * The Response object for the current request.
   */
  get res() {
    return this.#res ||= new Response(null, {
      headers: this.#preparedHeaders ??= new Headers()
    });
  }
  /**
   * Sets the Response object for the current request.
   *
   * @param _res - The Response object to set.
   */
  set res(_res) {
    if (this.#res && _res) {
      _res = new Response(_res.body, _res);
      for (const [k2, v2] of this.#res.headers.entries()) {
        if (k2 === "content-type") {
          continue;
        }
        if (k2 === "set-cookie") {
          const cookies = this.#res.headers.getSetCookie();
          _res.headers.delete("set-cookie");
          for (const cookie of cookies) {
            _res.headers.append("set-cookie", cookie);
          }
        } else {
          _res.headers.set(k2, v2);
        }
      }
    }
    this.#res = _res;
    this.finalized = true;
  }
  /**
   * `.render()` can create a response within a layout.
   *
   * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
   *
   * @example
   * ```ts
   * app.get('/', (c) => {
   *   return c.render('Hello!')
   * })
   * ```
   */
  render = /* @__PURE__ */ __name((...args) => {
    this.#renderer ??= (content) => this.html(content);
    return this.#renderer(...args);
  }, "render");
  /**
   * Sets the layout for the response.
   *
   * @param layout - The layout to set.
   * @returns The layout function.
   */
  setLayout = /* @__PURE__ */ __name((layout) => this.#layout = layout, "setLayout");
  /**
   * Gets the current layout for the response.
   *
   * @returns The current layout function.
   */
  getLayout = /* @__PURE__ */ __name(() => this.#layout, "getLayout");
  /**
   * `.setRenderer()` can set the layout in the custom middleware.
   *
   * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
   *
   * @example
   * ```tsx
   * app.use('*', async (c, next) => {
   *   c.setRenderer((content) => {
   *     return c.html(
   *       <html>
   *         <body>
   *           <p>{content}</p>
   *         </body>
   *       </html>
   *     )
   *   })
   *   await next()
   * })
   * ```
   */
  setRenderer = /* @__PURE__ */ __name((renderer) => {
    this.#renderer = renderer;
  }, "setRenderer");
  /**
   * `.header()` can set headers.
   *
   * @see {@link https://hono.dev/docs/api/context#header}
   *
   * @example
   * ```ts
   * app.get('/welcome', (c) => {
   *   // Set headers
   *   c.header('X-Message', 'Hello!')
   *   c.header('Content-Type', 'text/plain')
   *
   *   return c.body('Thank you for coming')
   * })
   * ```
   */
  header = /* @__PURE__ */ __name((name, value, options) => {
    if (this.finalized) {
      this.#res = new Response(this.#res.body, this.#res);
    }
    const headers = this.#res ? this.#res.headers : this.#preparedHeaders ??= new Headers();
    if (value === void 0) {
      headers.delete(name);
    } else if (options?.append) {
      headers.append(name, value);
    } else {
      headers.set(name, value);
    }
  }, "header");
  status = /* @__PURE__ */ __name((status) => {
    this.#status = status;
  }, "status");
  /**
   * `.set()` can set the value specified by the key.
   *
   * @see {@link https://hono.dev/docs/api/context#set-get}
   *
   * @example
   * ```ts
   * app.use('*', async (c, next) => {
   *   c.set('message', 'Hono is hot!!')
   *   await next()
   * })
   * ```
   */
  set = /* @__PURE__ */ __name((key, value) => {
    this.#var ??= /* @__PURE__ */ new Map();
    this.#var.set(key, value);
  }, "set");
  /**
   * `.get()` can use the value specified by the key.
   *
   * @see {@link https://hono.dev/docs/api/context#set-get}
   *
   * @example
   * ```ts
   * app.get('/', (c) => {
   *   const message = c.get('message')
   *   return c.text(`The message is "${message}"`)
   * })
   * ```
   */
  get = /* @__PURE__ */ __name((key) => {
    return this.#var ? this.#var.get(key) : void 0;
  }, "get");
  /**
   * `.var` can access the value of a variable.
   *
   * @see {@link https://hono.dev/docs/api/context#var}
   *
   * @example
   * ```ts
   * const result = c.var.client.oneMethod()
   * ```
   */
  // c.var.propName is a read-only
  get var() {
    if (!this.#var) {
      return {};
    }
    return Object.fromEntries(this.#var);
  }
  #newResponse(data, arg, headers) {
    const responseHeaders = this.#res ? new Headers(this.#res.headers) : this.#preparedHeaders ?? new Headers();
    if (typeof arg === "object" && "headers" in arg) {
      const argHeaders = arg.headers instanceof Headers ? arg.headers : new Headers(arg.headers);
      for (const [key, value] of argHeaders) {
        if (key.toLowerCase() === "set-cookie") {
          responseHeaders.append(key, value);
        } else {
          responseHeaders.set(key, value);
        }
      }
    }
    if (headers) {
      for (const [k2, v2] of Object.entries(headers)) {
        if (typeof v2 === "string") {
          responseHeaders.set(k2, v2);
        } else {
          responseHeaders.delete(k2);
          for (const v22 of v2) {
            responseHeaders.append(k2, v22);
          }
        }
      }
    }
    const status = typeof arg === "number" ? arg : arg?.status ?? this.#status;
    return new Response(data, { status, headers: responseHeaders });
  }
  newResponse = /* @__PURE__ */ __name((...args) => this.#newResponse(...args), "newResponse");
  /**
   * `.body()` can return the HTTP response.
   * You can set headers with `.header()` and set HTTP status code with `.status`.
   * This can also be set in `.text()`, `.json()` and so on.
   *
   * @see {@link https://hono.dev/docs/api/context#body}
   *
   * @example
   * ```ts
   * app.get('/welcome', (c) => {
   *   // Set headers
   *   c.header('X-Message', 'Hello!')
   *   c.header('Content-Type', 'text/plain')
   *   // Set HTTP status code
   *   c.status(201)
   *
   *   // Return the response body
   *   return c.body('Thank you for coming')
   * })
   * ```
   */
  body = /* @__PURE__ */ __name((data, arg, headers) => this.#newResponse(data, arg, headers), "body");
  /**
   * `.text()` can render text as `Content-Type:text/plain`.
   *
   * @see {@link https://hono.dev/docs/api/context#text}
   *
   * @example
   * ```ts
   * app.get('/say', (c) => {
   *   return c.text('Hello!')
   * })
   * ```
   */
  text = /* @__PURE__ */ __name((text2, arg, headers) => {
    return !this.#preparedHeaders && !this.#status && !arg && !headers && !this.finalized ? new Response(text2) : this.#newResponse(
      text2,
      arg,
      setDefaultContentType(TEXT_PLAIN, headers)
    );
  }, "text");
  /**
   * `.json()` can render JSON as `Content-Type:application/json`.
   *
   * @see {@link https://hono.dev/docs/api/context#json}
   *
   * @example
   * ```ts
   * app.get('/api', (c) => {
   *   return c.json({ message: 'Hello!' })
   * })
   * ```
   */
  json = /* @__PURE__ */ __name((object, arg, headers) => {
    return this.#newResponse(
      JSON.stringify(object),
      arg,
      setDefaultContentType("application/json", headers)
    );
  }, "json");
  html = /* @__PURE__ */ __name((html, arg, headers) => {
    const res = /* @__PURE__ */ __name((html2) => this.#newResponse(html2, arg, setDefaultContentType("text/html; charset=UTF-8", headers)), "res");
    return typeof html === "object" ? resolveCallback(html, HtmlEscapedCallbackPhase.Stringify, false, {}).then(res) : res(html);
  }, "html");
  /**
   * `.redirect()` can Redirect, default status code is 302.
   *
   * @see {@link https://hono.dev/docs/api/context#redirect}
   *
   * @example
   * ```ts
   * app.get('/redirect', (c) => {
   *   return c.redirect('/')
   * })
   * app.get('/redirect-permanently', (c) => {
   *   return c.redirect('/', 301)
   * })
   * ```
   */
  redirect = /* @__PURE__ */ __name((location, status) => {
    const locationString = String(location);
    this.header(
      "Location",
      // Multibyes should be encoded
      // eslint-disable-next-line no-control-regex
      !/[^\x00-\xFF]/.test(locationString) ? locationString : encodeURI(locationString)
    );
    return this.newResponse(null, status ?? 302);
  }, "redirect");
  /**
   * `.notFound()` can return the Not Found Response.
   *
   * @see {@link https://hono.dev/docs/api/context#notfound}
   *
   * @example
   * ```ts
   * app.get('/notfound', (c) => {
   *   return c.notFound()
   * })
   * ```
   */
  notFound = /* @__PURE__ */ __name(() => {
    this.#notFoundHandler ??= () => new Response();
    return this.#notFoundHandler(this);
  }, "notFound");
};

// node_modules/.pnpm/hono@4.11.4/node_modules/hono/dist/router.js
var METHOD_NAME_ALL = "ALL";
var METHOD_NAME_ALL_LOWERCASE = "all";
var METHODS = ["get", "post", "put", "delete", "options", "patch"];
var MESSAGE_MATCHER_IS_ALREADY_BUILT = "Can not add a route since the matcher is already built.";
var UnsupportedPathError = class extends Error {
  static {
    __name(this, "UnsupportedPathError");
  }
};

// node_modules/.pnpm/hono@4.11.4/node_modules/hono/dist/utils/constants.js
var COMPOSED_HANDLER = "__COMPOSED_HANDLER";

// node_modules/.pnpm/hono@4.11.4/node_modules/hono/dist/hono-base.js
var notFoundHandler = /* @__PURE__ */ __name((c) => {
  return c.text("404 Not Found", 404);
}, "notFoundHandler");
var errorHandler = /* @__PURE__ */ __name((err, c) => {
  if ("getResponse" in err) {
    const res = err.getResponse();
    return c.newResponse(res.body, res);
  }
  console.error(err);
  return c.text("Internal Server Error", 500);
}, "errorHandler");
var Hono = class _Hono {
  static {
    __name(this, "_Hono");
  }
  get;
  post;
  put;
  delete;
  options;
  patch;
  all;
  on;
  use;
  /*
    This class is like an abstract class and does not have a router.
    To use it, inherit the class and implement router in the constructor.
  */
  router;
  getPath;
  // Cannot use `#` because it requires visibility at JavaScript runtime.
  _basePath = "/";
  #path = "/";
  routes = [];
  constructor(options = {}) {
    const allMethods = [...METHODS, METHOD_NAME_ALL_LOWERCASE];
    allMethods.forEach((method) => {
      this[method] = (args1, ...args) => {
        if (typeof args1 === "string") {
          this.#path = args1;
        } else {
          this.#addRoute(method, this.#path, args1);
        }
        args.forEach((handler2) => {
          this.#addRoute(method, this.#path, handler2);
        });
        return this;
      };
    });
    this.on = (method, path, ...handlers) => {
      for (const p2 of [path].flat()) {
        this.#path = p2;
        for (const m2 of [method].flat()) {
          handlers.map((handler2) => {
            this.#addRoute(m2.toUpperCase(), this.#path, handler2);
          });
        }
      }
      return this;
    };
    this.use = (arg1, ...handlers) => {
      if (typeof arg1 === "string") {
        this.#path = arg1;
      } else {
        this.#path = "*";
        handlers.unshift(arg1);
      }
      handlers.forEach((handler2) => {
        this.#addRoute(METHOD_NAME_ALL, this.#path, handler2);
      });
      return this;
    };
    const { strict, ...optionsWithoutStrict } = options;
    Object.assign(this, optionsWithoutStrict);
    this.getPath = strict ?? true ? options.getPath ?? getPath : getPathNoStrict;
  }
  #clone() {
    const clone = new _Hono({
      router: this.router,
      getPath: this.getPath
    });
    clone.errorHandler = this.errorHandler;
    clone.#notFoundHandler = this.#notFoundHandler;
    clone.routes = this.routes;
    return clone;
  }
  #notFoundHandler = notFoundHandler;
  // Cannot use `#` because it requires visibility at JavaScript runtime.
  errorHandler = errorHandler;
  /**
   * `.route()` allows grouping other Hono instance in routes.
   *
   * @see {@link https://hono.dev/docs/api/routing#grouping}
   *
   * @param {string} path - base Path
   * @param {Hono} app - other Hono instance
   * @returns {Hono} routed Hono instance
   *
   * @example
   * ```ts
   * const app = new Hono()
   * const app2 = new Hono()
   *
   * app2.get("/user", (c) => c.text("user"))
   * app.route("/api", app2) // GET /api/user
   * ```
   */
  route(path, app2) {
    const subApp = this.basePath(path);
    app2.routes.map((r) => {
      let handler2;
      if (app2.errorHandler === errorHandler) {
        handler2 = r.handler;
      } else {
        handler2 = /* @__PURE__ */ __name(async (c, next) => (await compose([], app2.errorHandler)(c, () => r.handler(c, next))).res, "handler");
        handler2[COMPOSED_HANDLER] = r.handler;
      }
      subApp.#addRoute(r.method, r.path, handler2);
    });
    return this;
  }
  /**
   * `.basePath()` allows base paths to be specified.
   *
   * @see {@link https://hono.dev/docs/api/routing#base-path}
   *
   * @param {string} path - base Path
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * const api = new Hono().basePath('/api')
   * ```
   */
  basePath(path) {
    const subApp = this.#clone();
    subApp._basePath = mergePath(this._basePath, path);
    return subApp;
  }
  /**
   * `.onError()` handles an error and returns a customized Response.
   *
   * @see {@link https://hono.dev/docs/api/hono#error-handling}
   *
   * @param {ErrorHandler} handler - request Handler for error
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * app.onError((err, c) => {
   *   console.error(`${err}`)
   *   return c.text('Custom Error Message', 500)
   * })
   * ```
   */
  onError = /* @__PURE__ */ __name((handler2) => {
    this.errorHandler = handler2;
    return this;
  }, "onError");
  /**
   * `.notFound()` allows you to customize a Not Found Response.
   *
   * @see {@link https://hono.dev/docs/api/hono#not-found}
   *
   * @param {NotFoundHandler} handler - request handler for not-found
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * app.notFound((c) => {
   *   return c.text('Custom 404 Message', 404)
   * })
   * ```
   */
  notFound = /* @__PURE__ */ __name((handler2) => {
    this.#notFoundHandler = handler2;
    return this;
  }, "notFound");
  /**
   * `.mount()` allows you to mount applications built with other frameworks into your Hono application.
   *
   * @see {@link https://hono.dev/docs/api/hono#mount}
   *
   * @param {string} path - base Path
   * @param {Function} applicationHandler - other Request Handler
   * @param {MountOptions} [options] - options of `.mount()`
   * @returns {Hono} mounted Hono instance
   *
   * @example
   * ```ts
   * import { Router as IttyRouter } from 'itty-router'
   * import { Hono } from 'hono'
   * // Create itty-router application
   * const ittyRouter = IttyRouter()
   * // GET /itty-router/hello
   * ittyRouter.get('/hello', () => new Response('Hello from itty-router'))
   *
   * const app = new Hono()
   * app.mount('/itty-router', ittyRouter.handle)
   * ```
   *
   * @example
   * ```ts
   * const app = new Hono()
   * // Send the request to another application without modification.
   * app.mount('/app', anotherApp, {
   *   replaceRequest: (req) => req,
   * })
   * ```
   */
  mount(path, applicationHandler, options) {
    let replaceRequest;
    let optionHandler;
    if (options) {
      if (typeof options === "function") {
        optionHandler = options;
      } else {
        optionHandler = options.optionHandler;
        if (options.replaceRequest === false) {
          replaceRequest = /* @__PURE__ */ __name((request) => request, "replaceRequest");
        } else {
          replaceRequest = options.replaceRequest;
        }
      }
    }
    const getOptions = optionHandler ? (c) => {
      const options2 = optionHandler(c);
      return Array.isArray(options2) ? options2 : [options2];
    } : (c) => {
      let executionContext = void 0;
      try {
        executionContext = c.executionCtx;
      } catch {
      }
      return [c.env, executionContext];
    };
    replaceRequest ||= (() => {
      const mergedPath = mergePath(this._basePath, path);
      const pathPrefixLength = mergedPath === "/" ? 0 : mergedPath.length;
      return (request) => {
        const url = new URL(request.url);
        url.pathname = url.pathname.slice(pathPrefixLength) || "/";
        return new Request(url, request);
      };
    })();
    const handler2 = /* @__PURE__ */ __name(async (c, next) => {
      const res = await applicationHandler(replaceRequest(c.req.raw), ...getOptions(c));
      if (res) {
        return res;
      }
      await next();
    }, "handler");
    this.#addRoute(METHOD_NAME_ALL, mergePath(path, "*"), handler2);
    return this;
  }
  #addRoute(method, path, handler2) {
    method = method.toUpperCase();
    path = mergePath(this._basePath, path);
    const r = { basePath: this._basePath, path, method, handler: handler2 };
    this.router.add(method, path, [handler2, r]);
    this.routes.push(r);
  }
  #handleError(err, c) {
    if (err instanceof Error) {
      return this.errorHandler(err, c);
    }
    throw err;
  }
  #dispatch(request, executionCtx, env2, method) {
    if (method === "HEAD") {
      return (async () => new Response(null, await this.#dispatch(request, executionCtx, env2, "GET")))();
    }
    const path = this.getPath(request, { env: env2 });
    const matchResult = this.router.match(method, path);
    const c = new Context(request, {
      path,
      matchResult,
      env: env2,
      executionCtx,
      notFoundHandler: this.#notFoundHandler
    });
    if (matchResult[0].length === 1) {
      let res;
      try {
        res = matchResult[0][0][0][0](c, async () => {
          c.res = await this.#notFoundHandler(c);
        });
      } catch (err) {
        return this.#handleError(err, c);
      }
      return res instanceof Promise ? res.then(
        (resolved) => resolved || (c.finalized ? c.res : this.#notFoundHandler(c))
      ).catch((err) => this.#handleError(err, c)) : res ?? this.#notFoundHandler(c);
    }
    const composed = compose(matchResult[0], this.errorHandler, this.#notFoundHandler);
    return (async () => {
      try {
        const context = await composed(c);
        if (!context.finalized) {
          throw new Error(
            "Context is not finalized. Did you forget to return a Response object or `await next()`?"
          );
        }
        return context.res;
      } catch (err) {
        return this.#handleError(err, c);
      }
    })();
  }
  /**
   * `.fetch()` will be entry point of your app.
   *
   * @see {@link https://hono.dev/docs/api/hono#fetch}
   *
   * @param {Request} request - request Object of request
   * @param {Env} Env - env Object
   * @param {ExecutionContext} - context of execution
   * @returns {Response | Promise<Response>} response of request
   *
   */
  fetch = /* @__PURE__ */ __name((request, ...rest) => {
    return this.#dispatch(request, rest[1], rest[0], request.method);
  }, "fetch");
  /**
   * `.request()` is a useful method for testing.
   * You can pass a URL or pathname to send a GET request.
   * app will return a Response object.
   * ```ts
   * test('GET /hello is ok', async () => {
   *   const res = await app.request('/hello')
   *   expect(res.status).toBe(200)
   * })
   * ```
   * @see https://hono.dev/docs/api/hono#request
   */
  request = /* @__PURE__ */ __name((input, requestInit, Env, executionCtx) => {
    if (input instanceof Request) {
      return this.fetch(requestInit ? new Request(input, requestInit) : input, Env, executionCtx);
    }
    input = input.toString();
    return this.fetch(
      new Request(
        /^https?:\/\//.test(input) ? input : `http://localhost${mergePath("/", input)}`,
        requestInit
      ),
      Env,
      executionCtx
    );
  }, "request");
  /**
   * `.fire()` automatically adds a global fetch event listener.
   * This can be useful for environments that adhere to the Service Worker API, such as non-ES module Cloudflare Workers.
   * @deprecated
   * Use `fire` from `hono/service-worker` instead.
   * ```ts
   * import { Hono } from 'hono'
   * import { fire } from 'hono/service-worker'
   *
   * const app = new Hono()
   * // ...
   * fire(app)
   * ```
   * @see https://hono.dev/docs/api/hono#fire
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
   * @see https://developers.cloudflare.com/workers/reference/migrate-to-module-workers/
   */
  fire = /* @__PURE__ */ __name(() => {
    addEventListener("fetch", (event) => {
      event.respondWith(this.#dispatch(event.request, event, void 0, event.request.method));
    });
  }, "fire");
};

// node_modules/.pnpm/hono@4.11.4/node_modules/hono/dist/router/reg-exp-router/matcher.js
var emptyParam = [];
function match(method, path) {
  const matchers = this.buildAllMatchers();
  const match2 = /* @__PURE__ */ __name((method2, path2) => {
    const matcher = matchers[method2] || matchers[METHOD_NAME_ALL];
    const staticMatch = matcher[2][path2];
    if (staticMatch) {
      return staticMatch;
    }
    const match3 = path2.match(matcher[0]);
    if (!match3) {
      return [[], emptyParam];
    }
    const index2 = match3.indexOf("", 1);
    return [matcher[1][index2], match3];
  }, "match2");
  this.match = match2;
  return match2(method, path);
}
__name(match, "match");

// node_modules/.pnpm/hono@4.11.4/node_modules/hono/dist/router/reg-exp-router/node.js
var LABEL_REG_EXP_STR = "[^/]+";
var ONLY_WILDCARD_REG_EXP_STR = ".*";
var TAIL_WILDCARD_REG_EXP_STR = "(?:|/.*)";
var PATH_ERROR = /* @__PURE__ */ Symbol();
var regExpMetaChars = new Set(".\\+*[^]$()");
function compareKey(a, b2) {
  if (a.length === 1) {
    return b2.length === 1 ? a < b2 ? -1 : 1 : -1;
  }
  if (b2.length === 1) {
    return 1;
  }
  if (a === ONLY_WILDCARD_REG_EXP_STR || a === TAIL_WILDCARD_REG_EXP_STR) {
    return 1;
  } else if (b2 === ONLY_WILDCARD_REG_EXP_STR || b2 === TAIL_WILDCARD_REG_EXP_STR) {
    return -1;
  }
  if (a === LABEL_REG_EXP_STR) {
    return 1;
  } else if (b2 === LABEL_REG_EXP_STR) {
    return -1;
  }
  return a.length === b2.length ? a < b2 ? -1 : 1 : b2.length - a.length;
}
__name(compareKey, "compareKey");
var Node = class _Node {
  static {
    __name(this, "_Node");
  }
  #index;
  #varIndex;
  #children = /* @__PURE__ */ Object.create(null);
  insert(tokens, index2, paramMap, context, pathErrorCheckOnly) {
    if (tokens.length === 0) {
      if (this.#index !== void 0) {
        throw PATH_ERROR;
      }
      if (pathErrorCheckOnly) {
        return;
      }
      this.#index = index2;
      return;
    }
    const [token, ...restTokens] = tokens;
    const pattern = token === "*" ? restTokens.length === 0 ? ["", "", ONLY_WILDCARD_REG_EXP_STR] : ["", "", LABEL_REG_EXP_STR] : token === "/*" ? ["", "", TAIL_WILDCARD_REG_EXP_STR] : token.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
    let node;
    if (pattern) {
      const name = pattern[1];
      let regexpStr = pattern[2] || LABEL_REG_EXP_STR;
      if (name && pattern[2]) {
        if (regexpStr === ".*") {
          throw PATH_ERROR;
        }
        regexpStr = regexpStr.replace(/^\((?!\?:)(?=[^)]+\)$)/, "(?:");
        if (/\((?!\?:)/.test(regexpStr)) {
          throw PATH_ERROR;
        }
      }
      node = this.#children[regexpStr];
      if (!node) {
        if (Object.keys(this.#children).some(
          (k2) => k2 !== ONLY_WILDCARD_REG_EXP_STR && k2 !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.#children[regexpStr] = new _Node();
        if (name !== "") {
          node.#varIndex = context.varIndex++;
        }
      }
      if (!pathErrorCheckOnly && name !== "") {
        paramMap.push([name, node.#varIndex]);
      }
    } else {
      node = this.#children[token];
      if (!node) {
        if (Object.keys(this.#children).some(
          (k2) => k2.length > 1 && k2 !== ONLY_WILDCARD_REG_EXP_STR && k2 !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.#children[token] = new _Node();
      }
    }
    node.insert(restTokens, index2, paramMap, context, pathErrorCheckOnly);
  }
  buildRegExpStr() {
    const childKeys = Object.keys(this.#children).sort(compareKey);
    const strList = childKeys.map((k2) => {
      const c = this.#children[k2];
      return (typeof c.#varIndex === "number" ? `(${k2})@${c.#varIndex}` : regExpMetaChars.has(k2) ? `\\${k2}` : k2) + c.buildRegExpStr();
    });
    if (typeof this.#index === "number") {
      strList.unshift(`#${this.#index}`);
    }
    if (strList.length === 0) {
      return "";
    }
    if (strList.length === 1) {
      return strList[0];
    }
    return "(?:" + strList.join("|") + ")";
  }
};

// node_modules/.pnpm/hono@4.11.4/node_modules/hono/dist/router/reg-exp-router/trie.js
var Trie = class {
  static {
    __name(this, "Trie");
  }
  #context = { varIndex: 0 };
  #root = new Node();
  insert(path, index2, pathErrorCheckOnly) {
    const paramAssoc = [];
    const groups = [];
    for (let i = 0; ; ) {
      let replaced = false;
      path = path.replace(/\{[^}]+\}/g, (m2) => {
        const mark = `@\\${i}`;
        groups[i] = [mark, m2];
        i++;
        replaced = true;
        return mark;
      });
      if (!replaced) {
        break;
      }
    }
    const tokens = path.match(/(?::[^\/]+)|(?:\/\*$)|./g) || [];
    for (let i = groups.length - 1; i >= 0; i--) {
      const [mark] = groups[i];
      for (let j2 = tokens.length - 1; j2 >= 0; j2--) {
        if (tokens[j2].indexOf(mark) !== -1) {
          tokens[j2] = tokens[j2].replace(mark, groups[i][1]);
          break;
        }
      }
    }
    this.#root.insert(tokens, index2, paramAssoc, this.#context, pathErrorCheckOnly);
    return paramAssoc;
  }
  buildRegExp() {
    let regexp = this.#root.buildRegExpStr();
    if (regexp === "") {
      return [/^$/, [], []];
    }
    let captureIndex = 0;
    const indexReplacementMap = [];
    const paramReplacementMap = [];
    regexp = regexp.replace(/#(\d+)|@(\d+)|\.\*\$/g, (_2, handlerIndex, paramIndex) => {
      if (handlerIndex !== void 0) {
        indexReplacementMap[++captureIndex] = Number(handlerIndex);
        return "$()";
      }
      if (paramIndex !== void 0) {
        paramReplacementMap[Number(paramIndex)] = ++captureIndex;
        return "";
      }
      return "";
    });
    return [new RegExp(`^${regexp}`), indexReplacementMap, paramReplacementMap];
  }
};

// node_modules/.pnpm/hono@4.11.4/node_modules/hono/dist/router/reg-exp-router/router.js
var nullMatcher = [/^$/, [], /* @__PURE__ */ Object.create(null)];
var wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
function buildWildcardRegExp(path) {
  return wildcardRegExpCache[path] ??= new RegExp(
    path === "*" ? "" : `^${path.replace(
      /\/\*$|([.\\+*[^\]$()])/g,
      (_2, metaChar) => metaChar ? `\\${metaChar}` : "(?:|/.*)"
    )}$`
  );
}
__name(buildWildcardRegExp, "buildWildcardRegExp");
function clearWildcardRegExpCache() {
  wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
}
__name(clearWildcardRegExpCache, "clearWildcardRegExpCache");
function buildMatcherFromPreprocessedRoutes(routes) {
  const trie = new Trie();
  const handlerData = [];
  if (routes.length === 0) {
    return nullMatcher;
  }
  const routesWithStaticPathFlag = routes.map(
    (route) => [!/\*|\/:/.test(route[0]), ...route]
  ).sort(
    ([isStaticA, pathA], [isStaticB, pathB]) => isStaticA ? 1 : isStaticB ? -1 : pathA.length - pathB.length
  );
  const staticMap = /* @__PURE__ */ Object.create(null);
  for (let i = 0, j2 = -1, len = routesWithStaticPathFlag.length; i < len; i++) {
    const [pathErrorCheckOnly, path, handlers] = routesWithStaticPathFlag[i];
    if (pathErrorCheckOnly) {
      staticMap[path] = [handlers.map(([h]) => [h, /* @__PURE__ */ Object.create(null)]), emptyParam];
    } else {
      j2++;
    }
    let paramAssoc;
    try {
      paramAssoc = trie.insert(path, j2, pathErrorCheckOnly);
    } catch (e) {
      throw e === PATH_ERROR ? new UnsupportedPathError(path) : e;
    }
    if (pathErrorCheckOnly) {
      continue;
    }
    handlerData[j2] = handlers.map(([h, paramCount]) => {
      const paramIndexMap = /* @__PURE__ */ Object.create(null);
      paramCount -= 1;
      for (; paramCount >= 0; paramCount--) {
        const [key, value] = paramAssoc[paramCount];
        paramIndexMap[key] = value;
      }
      return [h, paramIndexMap];
    });
  }
  const [regexp, indexReplacementMap, paramReplacementMap] = trie.buildRegExp();
  for (let i = 0, len = handlerData.length; i < len; i++) {
    for (let j2 = 0, len2 = handlerData[i].length; j2 < len2; j2++) {
      const map = handlerData[i][j2]?.[1];
      if (!map) {
        continue;
      }
      const keys = Object.keys(map);
      for (let k2 = 0, len3 = keys.length; k2 < len3; k2++) {
        map[keys[k2]] = paramReplacementMap[map[keys[k2]]];
      }
    }
  }
  const handlerMap = [];
  for (const i in indexReplacementMap) {
    handlerMap[i] = handlerData[indexReplacementMap[i]];
  }
  return [regexp, handlerMap, staticMap];
}
__name(buildMatcherFromPreprocessedRoutes, "buildMatcherFromPreprocessedRoutes");
function findMiddleware(middleware, path) {
  if (!middleware) {
    return void 0;
  }
  for (const k2 of Object.keys(middleware).sort((a, b2) => b2.length - a.length)) {
    if (buildWildcardRegExp(k2).test(path)) {
      return [...middleware[k2]];
    }
  }
  return void 0;
}
__name(findMiddleware, "findMiddleware");
var RegExpRouter = class {
  static {
    __name(this, "RegExpRouter");
  }
  name = "RegExpRouter";
  #middleware;
  #routes;
  constructor() {
    this.#middleware = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
    this.#routes = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
  }
  add(method, path, handler2) {
    const middleware = this.#middleware;
    const routes = this.#routes;
    if (!middleware || !routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    if (!middleware[method]) {
      ;
      [middleware, routes].forEach((handlerMap) => {
        handlerMap[method] = /* @__PURE__ */ Object.create(null);
        Object.keys(handlerMap[METHOD_NAME_ALL]).forEach((p2) => {
          handlerMap[method][p2] = [...handlerMap[METHOD_NAME_ALL][p2]];
        });
      });
    }
    if (path === "/*") {
      path = "*";
    }
    const paramCount = (path.match(/\/:/g) || []).length;
    if (/\*$/.test(path)) {
      const re = buildWildcardRegExp(path);
      if (method === METHOD_NAME_ALL) {
        Object.keys(middleware).forEach((m2) => {
          middleware[m2][path] ||= findMiddleware(middleware[m2], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
        });
      } else {
        middleware[method][path] ||= findMiddleware(middleware[method], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
      }
      Object.keys(middleware).forEach((m2) => {
        if (method === METHOD_NAME_ALL || method === m2) {
          Object.keys(middleware[m2]).forEach((p2) => {
            re.test(p2) && middleware[m2][p2].push([handler2, paramCount]);
          });
        }
      });
      Object.keys(routes).forEach((m2) => {
        if (method === METHOD_NAME_ALL || method === m2) {
          Object.keys(routes[m2]).forEach(
            (p2) => re.test(p2) && routes[m2][p2].push([handler2, paramCount])
          );
        }
      });
      return;
    }
    const paths = checkOptionalParameter(path) || [path];
    for (let i = 0, len = paths.length; i < len; i++) {
      const path2 = paths[i];
      Object.keys(routes).forEach((m2) => {
        if (method === METHOD_NAME_ALL || method === m2) {
          routes[m2][path2] ||= [
            ...findMiddleware(middleware[m2], path2) || findMiddleware(middleware[METHOD_NAME_ALL], path2) || []
          ];
          routes[m2][path2].push([handler2, paramCount - len + i + 1]);
        }
      });
    }
  }
  match = match;
  buildAllMatchers() {
    const matchers = /* @__PURE__ */ Object.create(null);
    Object.keys(this.#routes).concat(Object.keys(this.#middleware)).forEach((method) => {
      matchers[method] ||= this.#buildMatcher(method);
    });
    this.#middleware = this.#routes = void 0;
    clearWildcardRegExpCache();
    return matchers;
  }
  #buildMatcher(method) {
    const routes = [];
    let hasOwnRoute = method === METHOD_NAME_ALL;
    [this.#middleware, this.#routes].forEach((r) => {
      const ownRoute = r[method] ? Object.keys(r[method]).map((path) => [path, r[method][path]]) : [];
      if (ownRoute.length !== 0) {
        hasOwnRoute ||= true;
        routes.push(...ownRoute);
      } else if (method !== METHOD_NAME_ALL) {
        routes.push(
          ...Object.keys(r[METHOD_NAME_ALL]).map((path) => [path, r[METHOD_NAME_ALL][path]])
        );
      }
    });
    if (!hasOwnRoute) {
      return null;
    } else {
      return buildMatcherFromPreprocessedRoutes(routes);
    }
  }
};

// node_modules/.pnpm/hono@4.11.4/node_modules/hono/dist/router/smart-router/router.js
var SmartRouter = class {
  static {
    __name(this, "SmartRouter");
  }
  name = "SmartRouter";
  #routers = [];
  #routes = [];
  constructor(init) {
    this.#routers = init.routers;
  }
  add(method, path, handler2) {
    if (!this.#routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    this.#routes.push([method, path, handler2]);
  }
  match(method, path) {
    if (!this.#routes) {
      throw new Error("Fatal error");
    }
    const routers = this.#routers;
    const routes = this.#routes;
    const len = routers.length;
    let i = 0;
    let res;
    for (; i < len; i++) {
      const router = routers[i];
      try {
        for (let i2 = 0, len2 = routes.length; i2 < len2; i2++) {
          router.add(...routes[i2]);
        }
        res = router.match(method, path);
      } catch (e) {
        if (e instanceof UnsupportedPathError) {
          continue;
        }
        throw e;
      }
      this.match = router.match.bind(router);
      this.#routers = [router];
      this.#routes = void 0;
      break;
    }
    if (i === len) {
      throw new Error("Fatal error");
    }
    this.name = `SmartRouter + ${this.activeRouter.name}`;
    return res;
  }
  get activeRouter() {
    if (this.#routes || this.#routers.length !== 1) {
      throw new Error("No active router has been determined yet.");
    }
    return this.#routers[0];
  }
};

// node_modules/.pnpm/hono@4.11.4/node_modules/hono/dist/router/trie-router/node.js
var emptyParams = /* @__PURE__ */ Object.create(null);
var Node2 = class _Node2 {
  static {
    __name(this, "_Node");
  }
  #methods;
  #children;
  #patterns;
  #order = 0;
  #params = emptyParams;
  constructor(method, handler2, children) {
    this.#children = children || /* @__PURE__ */ Object.create(null);
    this.#methods = [];
    if (method && handler2) {
      const m2 = /* @__PURE__ */ Object.create(null);
      m2[method] = { handler: handler2, possibleKeys: [], score: 0 };
      this.#methods = [m2];
    }
    this.#patterns = [];
  }
  insert(method, path, handler2) {
    this.#order = ++this.#order;
    let curNode = this;
    const parts = splitRoutingPath(path);
    const possibleKeys = [];
    for (let i = 0, len = parts.length; i < len; i++) {
      const p2 = parts[i];
      const nextP = parts[i + 1];
      const pattern = getPattern(p2, nextP);
      const key = Array.isArray(pattern) ? pattern[0] : p2;
      if (key in curNode.#children) {
        curNode = curNode.#children[key];
        if (pattern) {
          possibleKeys.push(pattern[1]);
        }
        continue;
      }
      curNode.#children[key] = new _Node2();
      if (pattern) {
        curNode.#patterns.push(pattern);
        possibleKeys.push(pattern[1]);
      }
      curNode = curNode.#children[key];
    }
    curNode.#methods.push({
      [method]: {
        handler: handler2,
        possibleKeys: possibleKeys.filter((v2, i, a) => a.indexOf(v2) === i),
        score: this.#order
      }
    });
    return curNode;
  }
  #getHandlerSets(node, method, nodeParams, params) {
    const handlerSets = [];
    for (let i = 0, len = node.#methods.length; i < len; i++) {
      const m2 = node.#methods[i];
      const handlerSet = m2[method] || m2[METHOD_NAME_ALL];
      const processedSet = {};
      if (handlerSet !== void 0) {
        handlerSet.params = /* @__PURE__ */ Object.create(null);
        handlerSets.push(handlerSet);
        if (nodeParams !== emptyParams || params && params !== emptyParams) {
          for (let i2 = 0, len2 = handlerSet.possibleKeys.length; i2 < len2; i2++) {
            const key = handlerSet.possibleKeys[i2];
            const processed = processedSet[handlerSet.score];
            handlerSet.params[key] = params?.[key] && !processed ? params[key] : nodeParams[key] ?? params?.[key];
            processedSet[handlerSet.score] = true;
          }
        }
      }
    }
    return handlerSets;
  }
  search(method, path) {
    const handlerSets = [];
    this.#params = emptyParams;
    const curNode = this;
    let curNodes = [curNode];
    const parts = splitPath(path);
    const curNodesQueue = [];
    for (let i = 0, len = parts.length; i < len; i++) {
      const part = parts[i];
      const isLast = i === len - 1;
      const tempNodes = [];
      for (let j2 = 0, len2 = curNodes.length; j2 < len2; j2++) {
        const node = curNodes[j2];
        const nextNode = node.#children[part];
        if (nextNode) {
          nextNode.#params = node.#params;
          if (isLast) {
            if (nextNode.#children["*"]) {
              handlerSets.push(
                ...this.#getHandlerSets(nextNode.#children["*"], method, node.#params)
              );
            }
            handlerSets.push(...this.#getHandlerSets(nextNode, method, node.#params));
          } else {
            tempNodes.push(nextNode);
          }
        }
        for (let k2 = 0, len3 = node.#patterns.length; k2 < len3; k2++) {
          const pattern = node.#patterns[k2];
          const params = node.#params === emptyParams ? {} : { ...node.#params };
          if (pattern === "*") {
            const astNode = node.#children["*"];
            if (astNode) {
              handlerSets.push(...this.#getHandlerSets(astNode, method, node.#params));
              astNode.#params = params;
              tempNodes.push(astNode);
            }
            continue;
          }
          const [key, name, matcher] = pattern;
          if (!part && !(matcher instanceof RegExp)) {
            continue;
          }
          const child = node.#children[key];
          const restPathString = parts.slice(i).join("/");
          if (matcher instanceof RegExp) {
            const m2 = matcher.exec(restPathString);
            if (m2) {
              params[name] = m2[0];
              handlerSets.push(...this.#getHandlerSets(child, method, node.#params, params));
              if (Object.keys(child.#children).length) {
                child.#params = params;
                const componentCount = m2[0].match(/\//)?.length ?? 0;
                const targetCurNodes = curNodesQueue[componentCount] ||= [];
                targetCurNodes.push(child);
              }
              continue;
            }
          }
          if (matcher === true || matcher.test(part)) {
            params[name] = part;
            if (isLast) {
              handlerSets.push(...this.#getHandlerSets(child, method, params, node.#params));
              if (child.#children["*"]) {
                handlerSets.push(
                  ...this.#getHandlerSets(child.#children["*"], method, params, node.#params)
                );
              }
            } else {
              child.#params = params;
              tempNodes.push(child);
            }
          }
        }
      }
      curNodes = tempNodes.concat(curNodesQueue.shift() ?? []);
    }
    if (handlerSets.length > 1) {
      handlerSets.sort((a, b2) => {
        return a.score - b2.score;
      });
    }
    return [handlerSets.map(({ handler: handler2, params }) => [handler2, params])];
  }
};

// node_modules/.pnpm/hono@4.11.4/node_modules/hono/dist/router/trie-router/router.js
var TrieRouter = class {
  static {
    __name(this, "TrieRouter");
  }
  name = "TrieRouter";
  #node;
  constructor() {
    this.#node = new Node2();
  }
  add(method, path, handler2) {
    const results = checkOptionalParameter(path);
    if (results) {
      for (let i = 0, len = results.length; i < len; i++) {
        this.#node.insert(method, results[i], handler2);
      }
      return;
    }
    this.#node.insert(method, path, handler2);
  }
  match(method, path) {
    return this.#node.search(method, path);
  }
};

// node_modules/.pnpm/hono@4.11.4/node_modules/hono/dist/hono.js
var Hono2 = class extends Hono {
  static {
    __name(this, "Hono");
  }
  /**
   * Creates an instance of the Hono class.
   *
   * @param options - Optional configuration options for the Hono instance.
   */
  constructor(options = {}) {
    super(options);
    this.router = options.router ?? new SmartRouter({
      routers: [new RegExpRouter(), new TrieRouter()]
    });
  }
};

// node_modules/.pnpm/hono@4.11.4/node_modules/hono/dist/middleware/cors/index.js
var cors = /* @__PURE__ */ __name((options) => {
  const defaults = {
    origin: "*",
    allowMethods: ["GET", "HEAD", "PUT", "POST", "DELETE", "PATCH"],
    allowHeaders: [],
    exposeHeaders: []
  };
  const opts = {
    ...defaults,
    ...options
  };
  const findAllowOrigin = ((optsOrigin) => {
    if (typeof optsOrigin === "string") {
      if (optsOrigin === "*") {
        return () => optsOrigin;
      } else {
        return (origin) => optsOrigin === origin ? origin : null;
      }
    } else if (typeof optsOrigin === "function") {
      return optsOrigin;
    } else {
      return (origin) => optsOrigin.includes(origin) ? origin : null;
    }
  })(opts.origin);
  const findAllowMethods = ((optsAllowMethods) => {
    if (typeof optsAllowMethods === "function") {
      return optsAllowMethods;
    } else if (Array.isArray(optsAllowMethods)) {
      return () => optsAllowMethods;
    } else {
      return () => [];
    }
  })(opts.allowMethods);
  return /* @__PURE__ */ __name(async function cors2(c, next) {
    function set(key, value) {
      c.res.headers.set(key, value);
    }
    __name(set, "set");
    const allowOrigin = await findAllowOrigin(c.req.header("origin") || "", c);
    if (allowOrigin) {
      set("Access-Control-Allow-Origin", allowOrigin);
    }
    if (opts.credentials) {
      set("Access-Control-Allow-Credentials", "true");
    }
    if (opts.exposeHeaders?.length) {
      set("Access-Control-Expose-Headers", opts.exposeHeaders.join(","));
    }
    if (c.req.method === "OPTIONS") {
      if (opts.origin !== "*") {
        set("Vary", "Origin");
      }
      if (opts.maxAge != null) {
        set("Access-Control-Max-Age", opts.maxAge.toString());
      }
      const allowMethods = await findAllowMethods(c.req.header("origin") || "", c);
      if (allowMethods.length) {
        set("Access-Control-Allow-Methods", allowMethods.join(","));
      }
      let headers = opts.allowHeaders;
      if (!headers?.length) {
        const requestHeaders = c.req.header("Access-Control-Request-Headers");
        if (requestHeaders) {
          headers = requestHeaders.split(/\s*,\s*/);
        }
      }
      if (headers?.length) {
        set("Access-Control-Allow-Headers", headers.join(","));
        c.res.headers.append("Vary", "Access-Control-Request-Headers");
      }
      c.res.headers.delete("Content-Length");
      c.res.headers.delete("Content-Type");
      return new Response(null, {
        headers: c.res.headers,
        status: 204,
        statusText: "No Content"
      });
    }
    await next();
    if (opts.origin !== "*") {
      c.header("Vary", "Origin", { append: true });
    }
  }, "cors2");
}, "cors");

// node_modules/.pnpm/hono@4.11.4/node_modules/hono/dist/utils/color.js
function getColorEnabled() {
  const { process: process2, Deno } = globalThis;
  const isNoColor = typeof Deno?.noColor === "boolean" ? Deno.noColor : process2 !== void 0 ? (
    // eslint-disable-next-line no-unsafe-optional-chaining
    "NO_COLOR" in process2?.env
  ) : false;
  return !isNoColor;
}
__name(getColorEnabled, "getColorEnabled");
async function getColorEnabledAsync() {
  const { navigator } = globalThis;
  const cfWorkers = "cloudflare:workers";
  const isNoColor = navigator !== void 0 && navigator.userAgent === "Cloudflare-Workers" ? await (async () => {
    try {
      return "NO_COLOR" in ((await import(cfWorkers)).env ?? {});
    } catch {
      return false;
    }
  })() : !getColorEnabled();
  return !isNoColor;
}
__name(getColorEnabledAsync, "getColorEnabledAsync");

// node_modules/.pnpm/hono@4.11.4/node_modules/hono/dist/middleware/logger/index.js
var humanize = /* @__PURE__ */ __name((times) => {
  const [delimiter, separator] = [",", "."];
  const orderTimes = times.map((v2) => v2.replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1" + delimiter));
  return orderTimes.join(separator);
}, "humanize");
var time = /* @__PURE__ */ __name((start) => {
  const delta = Date.now() - start;
  return humanize([delta < 1e3 ? delta + "ms" : Math.round(delta / 1e3) + "s"]);
}, "time");
var colorStatus = /* @__PURE__ */ __name(async (status) => {
  const colorEnabled = await getColorEnabledAsync();
  if (colorEnabled) {
    switch (status / 100 | 0) {
      case 5:
        return `\x1B[31m${status}\x1B[0m`;
      case 4:
        return `\x1B[33m${status}\x1B[0m`;
      case 3:
        return `\x1B[36m${status}\x1B[0m`;
      case 2:
        return `\x1B[32m${status}\x1B[0m`;
    }
  }
  return `${status}`;
}, "colorStatus");
async function log(fn, prefix, method, path, status = 0, elapsed) {
  const out = prefix === "<--" ? `${prefix} ${method} ${path}` : `${prefix} ${method} ${path} ${await colorStatus(status)} ${elapsed}`;
  fn(out);
}
__name(log, "log");
var logger = /* @__PURE__ */ __name((fn = console.log) => {
  return /* @__PURE__ */ __name(async function logger2(c, next) {
    const { method, url } = c.req;
    const path = url.slice(url.indexOf("/", 8));
    await log(fn, "<--", method, path);
    const start = Date.now();
    await next();
    await log(fn, "-->", method, path, c.res.status, time(start));
  }, "logger2");
}, "logger");

// node_modules/.pnpm/hono@4.11.4/node_modules/hono/dist/helper/websocket/index.js
var defineWebSocketHelper = /* @__PURE__ */ __name((handler2) => {
  return (...args) => {
    if (typeof args[0] === "function") {
      const [createEvents, options] = args;
      return /* @__PURE__ */ __name(async function upgradeWebSocket2(c, next) {
        const events = await createEvents(c);
        const result = await handler2(c, events, options);
        if (result) {
          return result;
        }
        await next();
      }, "upgradeWebSocket");
    } else {
      const [c, events, options] = args;
      return (async () => {
        const upgraded = await handler2(c, events, options);
        if (!upgraded) {
          throw new Error("Failed to upgrade WebSocket");
        }
        return upgraded;
      })();
    }
  };
}, "defineWebSocketHelper");

// node_modules/.pnpm/ws@8.19.0/node_modules/ws/wrapper.mjs
var import_stream = __toESM(require_stream(), 1);
var import_receiver = __toESM(require_receiver(), 1);
var import_sender = __toESM(require_sender(), 1);
var import_websocket = __toESM(require_websocket(), 1);
var import_websocket_server = __toESM(require_websocket_server(), 1);

// node_modules/.pnpm/@hono+node-ws@1.3.0_@hono+node-server@1.19.9_hono@4.11.4__hono@4.11.4/node_modules/@hono/node-ws/dist/index.js
import { STATUS_CODES } from "http";
var CloseEvent = globalThis.CloseEvent ?? class extends Event {
  #eventInitDict;
  constructor(type, eventInitDict = {}) {
    super(type, eventInitDict);
    this.#eventInitDict = eventInitDict;
  }
  get wasClean() {
    return this.#eventInitDict.wasClean ?? false;
  }
  get code() {
    return this.#eventInitDict.code ?? 0;
  }
  get reason() {
    return this.#eventInitDict.reason ?? "";
  }
};
var generateConnectionSymbol = /* @__PURE__ */ __name(() => Symbol("connection"), "generateConnectionSymbol");
var CONNECTION_SYMBOL_KEY = Symbol("CONNECTION_SYMBOL_KEY");
var createNodeWebSocket = /* @__PURE__ */ __name((init) => {
  const wss = new import_websocket_server.default({ noServer: true });
  const waiterMap = /* @__PURE__ */ new Map();
  wss.on("connection", (ws, request) => {
    const waiter = waiterMap.get(request);
    if (waiter) {
      waiter.resolve(ws);
      waiterMap.delete(request);
    }
  });
  const nodeUpgradeWebSocket = /* @__PURE__ */ __name((request, connectionSymbol) => {
    return new Promise((resolve) => {
      waiterMap.set(request, {
        resolve,
        connectionSymbol
      });
    });
  }, "nodeUpgradeWebSocket");
  return {
    wss,
    injectWebSocket(server) {
      server.on("upgrade", async (request, socket, head) => {
        const url = new URL(request.url ?? "/", init.baseUrl ?? "http://localhost");
        const headers = new Headers();
        for (const key in request.headers) {
          const value = request.headers[key];
          if (!value) continue;
          headers.append(key, Array.isArray(value) ? value[0] : value);
        }
        const env2 = {
          incoming: request,
          outgoing: void 0
        };
        const response = await init.app.request(url, { headers }, env2);
        const waiter = waiterMap.get(request);
        if (!waiter || waiter.connectionSymbol !== env2[CONNECTION_SYMBOL_KEY]) {
          socket.end(`HTTP/1.1 ${response.status.toString()} ${STATUS_CODES[response.status] ?? ""}\r
Connection: close\r
Content-Length: 0\r
\r
`);
          waiterMap.delete(request);
          return;
        }
        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit("connection", ws, request);
        });
      });
    },
    upgradeWebSocket: defineWebSocketHelper(async (c, events, options) => {
      if (c.req.header("upgrade")?.toLowerCase() !== "websocket") return;
      const connectionSymbol = generateConnectionSymbol();
      c.env[CONNECTION_SYMBOL_KEY] = connectionSymbol;
      (async () => {
        const ws = await nodeUpgradeWebSocket(c.env.incoming, connectionSymbol);
        const messagesReceivedInStarting = [];
        const bufferMessage = /* @__PURE__ */ __name((data, isBinary) => {
          messagesReceivedInStarting.push([data, isBinary]);
        }, "bufferMessage");
        ws.on("message", bufferMessage);
        const ctx = {
          binaryType: "arraybuffer",
          close(code, reason) {
            ws.close(code, reason);
          },
          protocol: ws.protocol,
          raw: ws,
          get readyState() {
            return ws.readyState;
          },
          send(source, opts) {
            ws.send(source, { compress: opts?.compress });
          },
          url: new URL(c.req.url)
        };
        try {
          events?.onOpen?.(new Event("open"), ctx);
        } catch (e) {
          (options?.onError ?? console.error)(e);
        }
        const handleMessage = /* @__PURE__ */ __name((data, isBinary) => {
          const datas = Array.isArray(data) ? data : [data];
          for (const data$1 of datas) try {
            events?.onMessage?.(new MessageEvent("message", { data: isBinary ? data$1 instanceof ArrayBuffer ? data$1 : data$1.buffer.slice(data$1.byteOffset, data$1.byteOffset + data$1.byteLength) : data$1.toString("utf-8") }), ctx);
          } catch (e) {
            (options?.onError ?? console.error)(e);
          }
        }, "handleMessage");
        ws.off("message", bufferMessage);
        for (const message2 of messagesReceivedInStarting) handleMessage(...message2);
        ws.on("message", (data, isBinary) => {
          handleMessage(data, isBinary);
        });
        ws.on("close", (code, reason) => {
          try {
            events?.onClose?.(new CloseEvent("close", {
              code,
              reason: reason.toString()
            }), ctx);
          } catch (e) {
            (options?.onError ?? console.error)(e);
          }
        });
        ws.on("error", (error) => {
          try {
            events?.onError?.(new ErrorEvent("error", { error }), ctx);
          } catch (e) {
            (options?.onError ?? console.error)(e);
          }
        });
      })();
      return new Response();
    })
  };
}, "createNodeWebSocket");

// packages/db/src/schema.ts
var schema_exports = {};
__export(schema_exports, {
  MAX_ONBOARDING_STEP: () => MAX_ONBOARDING_STEP,
  ONBOARDING_STEPS: () => ONBOARDING_STEPS,
  apiKeys: () => apiKeys,
  apiKeysRelations: () => apiKeysRelations,
  errorEvents: () => errorEvents,
  errorEventsRelations: () => errorEventsRelations,
  integrations: () => integrations,
  integrationsRelations: () => integrationsRelations,
  organizationInvites: () => organizationInvites,
  organizationInvitesRelations: () => organizationInvitesRelations,
  organizations: () => organizations,
  organizationsRelations: () => organizationsRelations,
  permissions: () => permissions,
  rolePermissions: () => rolePermissions,
  roleSkills: () => roleSkills,
  roles: () => roles,
  rolesRelations: () => rolesRelations,
  scrapeTasks: () => scrapeTasks,
  scrapeTasksRelations: () => scrapeTasksRelations,
  sessions: () => sessions,
  skillProposals: () => skillProposals,
  skillProposalsRelations: () => skillProposalsRelations,
  skillUsageLogs: () => skillUsageLogs,
  skills: () => skills,
  skillsRelations: () => skillsRelations,
  systemSettings: () => systemSettings,
  userRoles: () => userRoles,
  users: () => users,
  usersRelations: () => usersRelations
});

// node_modules/.pnpm/drizzle-orm@0.45.1_@libsql+client@0.17.0_@types+better-sqlite3@7.6.13_better-sqlite3@12.6.2/node_modules/drizzle-orm/entity.js
var entityKind = Symbol.for("drizzle:entityKind");
var hasOwnEntityKind = Symbol.for("drizzle:hasOwnEntityKind");
function is(value, type) {
  if (!value || typeof value !== "object") {
    return false;
  }
  if (value instanceof type) {
    return true;
  }
  if (!Object.prototype.hasOwnProperty.call(type, entityKind)) {
    throw new Error(
      `Class "${type.name ?? "<unknown>"}" doesn't look like a Drizzle entity. If this is incorrect and the class is provided by Drizzle, please report this as a bug.`
    );
  }
  let cls = Object.getPrototypeOf(value).constructor;
  if (cls) {
    while (cls) {
      if (entityKind in cls && cls[entityKind] === type[entityKind]) {
        return true;
      }
      cls = Object.getPrototypeOf(cls);
    }
  }
  return false;
}
__name(is, "is");

// node_modules/.pnpm/drizzle-orm@0.45.1_@libsql+client@0.17.0_@types+better-sqlite3@7.6.13_better-sqlite3@12.6.2/node_modules/drizzle-orm/column.js
var Column = class {
  static {
    __name(this, "Column");
  }
  constructor(table, config) {
    this.table = table;
    this.config = config;
    this.name = config.name;
    this.keyAsName = config.keyAsName;
    this.notNull = config.notNull;
    this.default = config.default;
    this.defaultFn = config.defaultFn;
    this.onUpdateFn = config.onUpdateFn;
    this.hasDefault = config.hasDefault;
    this.primary = config.primaryKey;
    this.isUnique = config.isUnique;
    this.uniqueName = config.uniqueName;
    this.uniqueType = config.uniqueType;
    this.dataType = config.dataType;
    this.columnType = config.columnType;
    this.generated = config.generated;
    this.generatedIdentity = config.generatedIdentity;
  }
  static [entityKind] = "Column";
  name;
  keyAsName;
  primary;
  notNull;
  default;
  defaultFn;
  onUpdateFn;
  hasDefault;
  isUnique;
  uniqueName;
  uniqueType;
  dataType;
  columnType;
  enumValues = void 0;
  generated = void 0;
  generatedIdentity = void 0;
  config;
  mapFromDriverValue(value) {
    return value;
  }
  mapToDriverValue(value) {
    return value;
  }
  // ** @internal */
  shouldDisableInsert() {
    return this.config.generated !== void 0 && this.config.generated.type !== "byDefault";
  }
};

// node_modules/.pnpm/drizzle-orm@0.45.1_@libsql+client@0.17.0_@types+better-sqlite3@7.6.13_better-sqlite3@12.6.2/node_modules/drizzle-orm/column-builder.js
var ColumnBuilder = class {
  static {
    __name(this, "ColumnBuilder");
  }
  static [entityKind] = "ColumnBuilder";
  config;
  constructor(name, dataType, columnType) {
    this.config = {
      name,
      keyAsName: name === "",
      notNull: false,
      default: void 0,
      hasDefault: false,
      primaryKey: false,
      isUnique: false,
      uniqueName: void 0,
      uniqueType: void 0,
      dataType,
      columnType,
      generated: void 0
    };
  }
  /**
   * Changes the data type of the column. Commonly used with `json` columns. Also, useful for branded types.
   *
   * @example
   * ```ts
   * const users = pgTable('users', {
   * 	id: integer('id').$type<UserId>().primaryKey(),
   * 	details: json('details').$type<UserDetails>().notNull(),
   * });
   * ```
   */
  $type() {
    return this;
  }
  /**
   * Adds a `not null` clause to the column definition.
   *
   * Affects the `select` model of the table - columns *without* `not null` will be nullable on select.
   */
  notNull() {
    this.config.notNull = true;
    return this;
  }
  /**
   * Adds a `default <value>` clause to the column definition.
   *
   * Affects the `insert` model of the table - columns *with* `default` are optional on insert.
   *
   * If you need to set a dynamic default value, use {@link $defaultFn} instead.
   */
  default(value) {
    this.config.default = value;
    this.config.hasDefault = true;
    return this;
  }
  /**
   * Adds a dynamic default value to the column.
   * The function will be called when the row is inserted, and the returned value will be used as the column value.
   *
   * **Note:** This value does not affect the `drizzle-kit` behavior, it is only used at runtime in `drizzle-orm`.
   */
  $defaultFn(fn) {
    this.config.defaultFn = fn;
    this.config.hasDefault = true;
    return this;
  }
  /**
   * Alias for {@link $defaultFn}.
   */
  $default = this.$defaultFn;
  /**
   * Adds a dynamic update value to the column.
   * The function will be called when the row is updated, and the returned value will be used as the column value if none is provided.
   * If no `default` (or `$defaultFn`) value is provided, the function will be called when the row is inserted as well, and the returned value will be used as the column value.
   *
   * **Note:** This value does not affect the `drizzle-kit` behavior, it is only used at runtime in `drizzle-orm`.
   */
  $onUpdateFn(fn) {
    this.config.onUpdateFn = fn;
    this.config.hasDefault = true;
    return this;
  }
  /**
   * Alias for {@link $onUpdateFn}.
   */
  $onUpdate = this.$onUpdateFn;
  /**
   * Adds a `primary key` clause to the column definition. This implicitly makes the column `not null`.
   *
   * In SQLite, `integer primary key` implicitly makes the column auto-incrementing.
   */
  primaryKey() {
    this.config.primaryKey = true;
    this.config.notNull = true;
    return this;
  }
  /** @internal Sets the name of the column to the key within the table definition if a name was not given. */
  setName(name) {
    if (this.config.name !== "") return;
    this.config.name = name;
  }
};

// node_modules/.pnpm/drizzle-orm@0.45.1_@libsql+client@0.17.0_@types+better-sqlite3@7.6.13_better-sqlite3@12.6.2/node_modules/drizzle-orm/table.utils.js
var TableName = Symbol.for("drizzle:Name");

// node_modules/.pnpm/drizzle-orm@0.45.1_@libsql+client@0.17.0_@types+better-sqlite3@7.6.13_better-sqlite3@12.6.2/node_modules/drizzle-orm/pg-core/foreign-keys.js
var ForeignKeyBuilder = class {
  static {
    __name(this, "ForeignKeyBuilder");
  }
  static [entityKind] = "PgForeignKeyBuilder";
  /** @internal */
  reference;
  /** @internal */
  _onUpdate = "no action";
  /** @internal */
  _onDelete = "no action";
  constructor(config, actions) {
    this.reference = () => {
      const { name, columns, foreignColumns } = config();
      return { name, columns, foreignTable: foreignColumns[0].table, foreignColumns };
    };
    if (actions) {
      this._onUpdate = actions.onUpdate;
      this._onDelete = actions.onDelete;
    }
  }
  onUpdate(action) {
    this._onUpdate = action === void 0 ? "no action" : action;
    return this;
  }
  onDelete(action) {
    this._onDelete = action === void 0 ? "no action" : action;
    return this;
  }
  /** @internal */
  build(table) {
    return new ForeignKey(table, this);
  }
};
var ForeignKey = class {
  static {
    __name(this, "ForeignKey");
  }
  constructor(table, builder) {
    this.table = table;
    this.reference = builder.reference;
    this.onUpdate = builder._onUpdate;
    this.onDelete = builder._onDelete;
  }
  static [entityKind] = "PgForeignKey";
  reference;
  onUpdate;
  onDelete;
  getName() {
    const { name, columns, foreignColumns } = this.reference();
    const columnNames = columns.map((column) => column.name);
    const foreignColumnNames = foreignColumns.map((column) => column.name);
    const chunks = [
      this.table[TableName],
      ...columnNames,
      foreignColumns[0].table[TableName],
      ...foreignColumnNames
    ];
    return name ?? `${chunks.join("_")}_fk`;
  }
};

// node_modules/.pnpm/drizzle-orm@0.45.1_@libsql+client@0.17.0_@types+better-sqlite3@7.6.13_better-sqlite3@12.6.2/node_modules/drizzle-orm/tracing-utils.js
function iife(fn, ...args) {
  return fn(...args);
}
__name(iife, "iife");

// node_modules/.pnpm/drizzle-orm@0.45.1_@libsql+client@0.17.0_@types+better-sqlite3@7.6.13_better-sqlite3@12.6.2/node_modules/drizzle-orm/pg-core/unique-constraint.js
function uniqueKeyName(table, columns) {
  return `${table[TableName]}_${columns.join("_")}_unique`;
}
__name(uniqueKeyName, "uniqueKeyName");
var UniqueConstraintBuilder = class {
  static {
    __name(this, "UniqueConstraintBuilder");
  }
  constructor(columns, name) {
    this.name = name;
    this.columns = columns;
  }
  static [entityKind] = "PgUniqueConstraintBuilder";
  /** @internal */
  columns;
  /** @internal */
  nullsNotDistinctConfig = false;
  nullsNotDistinct() {
    this.nullsNotDistinctConfig = true;
    return this;
  }
  /** @internal */
  build(table) {
    return new UniqueConstraint(table, this.columns, this.nullsNotDistinctConfig, this.name);
  }
};
var UniqueOnConstraintBuilder = class {
  static {
    __name(this, "UniqueOnConstraintBuilder");
  }
  static [entityKind] = "PgUniqueOnConstraintBuilder";
  /** @internal */
  name;
  constructor(name) {
    this.name = name;
  }
  on(...columns) {
    return new UniqueConstraintBuilder(columns, this.name);
  }
};
var UniqueConstraint = class {
  static {
    __name(this, "UniqueConstraint");
  }
  constructor(table, columns, nullsNotDistinct, name) {
    this.table = table;
    this.columns = columns;
    this.name = name ?? uniqueKeyName(this.table, this.columns.map((column) => column.name));
    this.nullsNotDistinct = nullsNotDistinct;
  }
  static [entityKind] = "PgUniqueConstraint";
  columns;
  name;
  nullsNotDistinct = false;
  getName() {
    return this.name;
  }
};

// node_modules/.pnpm/drizzle-orm@0.45.1_@libsql+client@0.17.0_@types+better-sqlite3@7.6.13_better-sqlite3@12.6.2/node_modules/drizzle-orm/pg-core/utils/array.js
function parsePgArrayValue(arrayString, startFrom, inQuotes) {
  for (let i = startFrom; i < arrayString.length; i++) {
    const char = arrayString[i];
    if (char === "\\") {
      i++;
      continue;
    }
    if (char === '"') {
      return [arrayString.slice(startFrom, i).replace(/\\/g, ""), i + 1];
    }
    if (inQuotes) {
      continue;
    }
    if (char === "," || char === "}") {
      return [arrayString.slice(startFrom, i).replace(/\\/g, ""), i];
    }
  }
  return [arrayString.slice(startFrom).replace(/\\/g, ""), arrayString.length];
}
__name(parsePgArrayValue, "parsePgArrayValue");
function parsePgNestedArray(arrayString, startFrom = 0) {
  const result = [];
  let i = startFrom;
  let lastCharIsComma = false;
  while (i < arrayString.length) {
    const char = arrayString[i];
    if (char === ",") {
      if (lastCharIsComma || i === startFrom) {
        result.push("");
      }
      lastCharIsComma = true;
      i++;
      continue;
    }
    lastCharIsComma = false;
    if (char === "\\") {
      i += 2;
      continue;
    }
    if (char === '"') {
      const [value2, startFrom2] = parsePgArrayValue(arrayString, i + 1, true);
      result.push(value2);
      i = startFrom2;
      continue;
    }
    if (char === "}") {
      return [result, i + 1];
    }
    if (char === "{") {
      const [value2, startFrom2] = parsePgNestedArray(arrayString, i + 1);
      result.push(value2);
      i = startFrom2;
      continue;
    }
    const [value, newStartFrom] = parsePgArrayValue(arrayString, i, false);
    result.push(value);
    i = newStartFrom;
  }
  return [result, i];
}
__name(parsePgNestedArray, "parsePgNestedArray");
function parsePgArray(arrayString) {
  const [result] = parsePgNestedArray(arrayString, 1);
  return result;
}
__name(parsePgArray, "parsePgArray");
function makePgArray(array) {
  return `{${array.map((item) => {
    if (Array.isArray(item)) {
      return makePgArray(item);
    }
    if (typeof item === "string") {
      return `"${item.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
    }
    return `${item}`;
  }).join(",")}}`;
}
__name(makePgArray, "makePgArray");

// node_modules/.pnpm/drizzle-orm@0.45.1_@libsql+client@0.17.0_@types+better-sqlite3@7.6.13_better-sqlite3@12.6.2/node_modules/drizzle-orm/pg-core/columns/common.js
var PgColumnBuilder = class extends ColumnBuilder {
  static {
    __name(this, "PgColumnBuilder");
  }
  foreignKeyConfigs = [];
  static [entityKind] = "PgColumnBuilder";
  array(size) {
    return new PgArrayBuilder(this.config.name, this, size);
  }
  references(ref, actions = {}) {
    this.foreignKeyConfigs.push({ ref, actions });
    return this;
  }
  unique(name, config) {
    this.config.isUnique = true;
    this.config.uniqueName = name;
    this.config.uniqueType = config?.nulls;
    return this;
  }
  generatedAlwaysAs(as) {
    this.config.generated = {
      as,
      type: "always",
      mode: "stored"
    };
    return this;
  }
  /** @internal */
  buildForeignKeys(column, table) {
    return this.foreignKeyConfigs.map(({ ref, actions }) => {
      return iife(
        (ref2, actions2) => {
          const builder = new ForeignKeyBuilder(() => {
            const foreignColumn = ref2();
            return { columns: [column], foreignColumns: [foreignColumn] };
          });
          if (actions2.onUpdate) {
            builder.onUpdate(actions2.onUpdate);
          }
          if (actions2.onDelete) {
            builder.onDelete(actions2.onDelete);
          }
          return builder.build(table);
        },
        ref,
        actions
      );
    });
  }
  /** @internal */
  buildExtraConfigColumn(table) {
    return new ExtraConfigColumn(table, this.config);
  }
};
var PgColumn = class extends Column {
  static {
    __name(this, "PgColumn");
  }
  constructor(table, config) {
    if (!config.uniqueName) {
      config.uniqueName = uniqueKeyName(table, [config.name]);
    }
    super(table, config);
    this.table = table;
  }
  static [entityKind] = "PgColumn";
};
var ExtraConfigColumn = class extends PgColumn {
  static {
    __name(this, "ExtraConfigColumn");
  }
  static [entityKind] = "ExtraConfigColumn";
  getSQLType() {
    return this.getSQLType();
  }
  indexConfig = {
    order: this.config.order ?? "asc",
    nulls: this.config.nulls ?? "last",
    opClass: this.config.opClass
  };
  defaultConfig = {
    order: "asc",
    nulls: "last",
    opClass: void 0
  };
  asc() {
    this.indexConfig.order = "asc";
    return this;
  }
  desc() {
    this.indexConfig.order = "desc";
    return this;
  }
  nullsFirst() {
    this.indexConfig.nulls = "first";
    return this;
  }
  nullsLast() {
    this.indexConfig.nulls = "last";
    return this;
  }
  /**
   * ### PostgreSQL documentation quote
   *
   * > An operator class with optional parameters can be specified for each column of an index.
   * The operator class identifies the operators to be used by the index for that column.
   * For example, a B-tree index on four-byte integers would use the int4_ops class;
   * this operator class includes comparison functions for four-byte integers.
   * In practice the default operator class for the column's data type is usually sufficient.
   * The main point of having operator classes is that for some data types, there could be more than one meaningful ordering.
   * For example, we might want to sort a complex-number data type either by absolute value or by real part.
   * We could do this by defining two operator classes for the data type and then selecting the proper class when creating an index.
   * More information about operator classes check:
   *
   * ### Useful links
   * https://www.postgresql.org/docs/current/sql-createindex.html
   *
   * https://www.postgresql.org/docs/current/indexes-opclass.html
   *
   * https://www.postgresql.org/docs/current/xindex.html
   *
   * ### Additional types
   * If you have the `pg_vector` extension installed in your database, you can use the
   * `vector_l2_ops`, `vector_ip_ops`, `vector_cosine_ops`, `vector_l1_ops`, `bit_hamming_ops`, `bit_jaccard_ops`, `halfvec_l2_ops`, `sparsevec_l2_ops` options, which are predefined types.
   *
   * **You can always specify any string you want in the operator class, in case Drizzle doesn't have it natively in its types**
   *
   * @param opClass
   * @returns
   */
  op(opClass) {
    this.indexConfig.opClass = opClass;
    return this;
  }
};
var IndexedColumn = class {
  static {
    __name(this, "IndexedColumn");
  }
  static [entityKind] = "IndexedColumn";
  constructor(name, keyAsName, type, indexConfig) {
    this.name = name;
    this.keyAsName = keyAsName;
    this.type = type;
    this.indexConfig = indexConfig;
  }
  name;
  keyAsName;
  type;
  indexConfig;
};
var PgArrayBuilder = class extends PgColumnBuilder {
  static {
    __name(this, "PgArrayBuilder");
  }
  static [entityKind] = "PgArrayBuilder";
  constructor(name, baseBuilder, size) {
    super(name, "array", "PgArray");
    this.config.baseBuilder = baseBuilder;
    this.config.size = size;
  }
  /** @internal */
  build(table) {
    const baseColumn = this.config.baseBuilder.build(table);
    return new PgArray(
      table,
      this.config,
      baseColumn
    );
  }
};
var PgArray = class _PgArray extends PgColumn {
  static {
    __name(this, "PgArray");
  }
  constructor(table, config, baseColumn, range) {
    super(table, config);
    this.baseColumn = baseColumn;
    this.range = range;
    this.size = config.size;
  }
  size;
  static [entityKind] = "PgArray";
  getSQLType() {
    return `${this.baseColumn.getSQLType()}[${typeof this.size === "number" ? this.size : ""}]`;
  }
  mapFromDriverValue(value) {
    if (typeof value === "string") {
      value = parsePgArray(value);
    }
    return value.map((v2) => this.baseColumn.mapFromDriverValue(v2));
  }
  mapToDriverValue(value, isNestedArray = false) {
    const a = value.map(
      (v2) => v2 === null ? null : is(this.baseColumn, _PgArray) ? this.baseColumn.mapToDriverValue(v2, true) : this.baseColumn.mapToDriverValue(v2)
    );
    if (isNestedArray) return a;
    return makePgArray(a);
  }
};

// node_modules/.pnpm/drizzle-orm@0.45.1_@libsql+client@0.17.0_@types+better-sqlite3@7.6.13_better-sqlite3@12.6.2/node_modules/drizzle-orm/pg-core/columns/enum.js
var PgEnumObjectColumnBuilder = class extends PgColumnBuilder {
  static {
    __name(this, "PgEnumObjectColumnBuilder");
  }
  static [entityKind] = "PgEnumObjectColumnBuilder";
  constructor(name, enumInstance) {
    super(name, "string", "PgEnumObjectColumn");
    this.config.enum = enumInstance;
  }
  /** @internal */
  build(table) {
    return new PgEnumObjectColumn(
      table,
      this.config
    );
  }
};
var PgEnumObjectColumn = class extends PgColumn {
  static {
    __name(this, "PgEnumObjectColumn");
  }
  static [entityKind] = "PgEnumObjectColumn";
  enum;
  enumValues = this.config.enum.enumValues;
  constructor(table, config) {
    super(table, config);
    this.enum = config.enum;
  }
  getSQLType() {
    return this.enum.enumName;
  }
};
var isPgEnumSym = Symbol.for("drizzle:isPgEnum");
function isPgEnum(obj) {
  return !!obj && typeof obj === "function" && isPgEnumSym in obj && obj[isPgEnumSym] === true;
}
__name(isPgEnum, "isPgEnum");
var PgEnumColumnBuilder = class extends PgColumnBuilder {
  static {
    __name(this, "PgEnumColumnBuilder");
  }
  static [entityKind] = "PgEnumColumnBuilder";
  constructor(name, enumInstance) {
    super(name, "string", "PgEnumColumn");
    this.config.enum = enumInstance;
  }
  /** @internal */
  build(table) {
    return new PgEnumColumn(
      table,
      this.config
    );
  }
};
var PgEnumColumn = class extends PgColumn {
  static {
    __name(this, "PgEnumColumn");
  }
  static [entityKind] = "PgEnumColumn";
  enum = this.config.enum;
  enumValues = this.config.enum.enumValues;
  constructor(table, config) {
    super(table, config);
    this.enum = config.enum;
  }
  getSQLType() {
    return this.enum.enumName;
  }
};

// node_modules/.pnpm/drizzle-orm@0.45.1_@libsql+client@0.17.0_@types+better-sqlite3@7.6.13_better-sqlite3@12.6.2/node_modules/drizzle-orm/subquery.js
var Subquery = class {
  static {
    __name(this, "Subquery");
  }
  static [entityKind] = "Subquery";
  constructor(sql2, fields, alias, isWith = false, usedTables = []) {
    this._ = {
      brand: "Subquery",
      sql: sql2,
      selectedFields: fields,
      alias,
      isWith,
      usedTables
    };
  }
  // getSQL(): SQL<unknown> {
  // 	return new SQL([this]);
  // }
};
var WithSubquery = class extends Subquery {
  static {
    __name(this, "WithSubquery");
  }
  static [entityKind] = "WithSubquery";
};

// node_modules/.pnpm/drizzle-orm@0.45.1_@libsql+client@0.17.0_@types+better-sqlite3@7.6.13_better-sqlite3@12.6.2/node_modules/drizzle-orm/version.js
var version = "0.45.1";

// node_modules/.pnpm/drizzle-orm@0.45.1_@libsql+client@0.17.0_@types+better-sqlite3@7.6.13_better-sqlite3@12.6.2/node_modules/drizzle-orm/tracing.js
var otel;
var rawTracer;
var tracer = {
  startActiveSpan(name, fn) {
    if (!otel) {
      return fn();
    }
    if (!rawTracer) {
      rawTracer = otel.trace.getTracer("drizzle-orm", version);
    }
    return iife(
      (otel2, rawTracer2) => rawTracer2.startActiveSpan(
        name,
        (span) => {
          try {
            return fn(span);
          } catch (e) {
            span.setStatus({
              code: otel2.SpanStatusCode.ERROR,
              message: e instanceof Error ? e.message : "Unknown error"
              // eslint-disable-line no-instanceof/no-instanceof
            });
            throw e;
          } finally {
            span.end();
          }
        }
      ),
      otel,
      rawTracer
    );
  }
};

// node_modules/.pnpm/drizzle-orm@0.45.1_@libsql+client@0.17.0_@types+better-sqlite3@7.6.13_better-sqlite3@12.6.2/node_modules/drizzle-orm/view-common.js
var ViewBaseConfig = Symbol.for("drizzle:ViewBaseConfig");

// node_modules/.pnpm/drizzle-orm@0.45.1_@libsql+client@0.17.0_@types+better-sqlite3@7.6.13_better-sqlite3@12.6.2/node_modules/drizzle-orm/table.js
var Schema = Symbol.for("drizzle:Schema");
var Columns = Symbol.for("drizzle:Columns");
var ExtraConfigColumns = Symbol.for("drizzle:ExtraConfigColumns");
var OriginalName = Symbol.for("drizzle:OriginalName");
var BaseName = Symbol.for("drizzle:BaseName");
var IsAlias = Symbol.for("drizzle:IsAlias");
var ExtraConfigBuilder = Symbol.for("drizzle:ExtraConfigBuilder");
var IsDrizzleTable = Symbol.for("drizzle:IsDrizzleTable");
var Table = class {
  static {
    __name(this, "Table");
  }
  static [entityKind] = "Table";
  /** @internal */
  static Symbol = {
    Name: TableName,
    Schema,
    OriginalName,
    Columns,
    ExtraConfigColumns,
    BaseName,
    IsAlias,
    ExtraConfigBuilder
  };
  /**
   * @internal
   * Can be changed if the table is aliased.
   */
  [TableName];
  /**
   * @internal
   * Used to store the original name of the table, before any aliasing.
   */
  [OriginalName];
  /** @internal */
  [Schema];
  /** @internal */
  [Columns];
  /** @internal */
  [ExtraConfigColumns];
  /**
   *  @internal
   * Used to store the table name before the transformation via the `tableCreator` functions.
   */
  [BaseName];
  /** @internal */
  [IsAlias] = false;
  /** @internal */
  [IsDrizzleTable] = true;
  /** @internal */
  [ExtraConfigBuilder] = void 0;
  constructor(name, schema, baseName) {
    this[TableName] = this[OriginalName] = name;
    this[Schema] = schema;
    this[BaseName] = baseName;
  }
};
function getTableName(table) {
  return table[TableName];
}
__name(getTableName, "getTableName");
function getTableUniqueName(table) {
  return `${table[Schema] ?? "public"}.${table[TableName]}`;
}
__name(getTableUniqueName, "getTableUniqueName");

// node_modules/.pnpm/drizzle-orm@0.45.1_@libsql+client@0.17.0_@types+better-sqlite3@7.6.13_better-sqlite3@12.6.2/node_modules/drizzle-orm/sql/sql.js
var FakePrimitiveParam = class {
  static {
    __name(this, "FakePrimitiveParam");
  }
  static [entityKind] = "FakePrimitiveParam";
};
function isSQLWrapper(value) {
  return value !== null && value !== void 0 && typeof value.getSQL === "function";
}
__name(isSQLWrapper, "isSQLWrapper");
function mergeQueries(queries) {
  const result = { sql: "", params: [] };
  for (const query of queries) {
    result.sql += query.sql;
    result.params.push(...query.params);
    if (query.typings?.length) {
      if (!result.typings) {
        result.typings = [];
      }
      result.typings.push(...query.typings);
    }
  }
  return result;
}
__name(mergeQueries, "mergeQueries");
var StringChunk = class {
  static {
    __name(this, "StringChunk");
  }
  static [entityKind] = "StringChunk";
  value;
  constructor(value) {
    this.value = Array.isArray(value) ? value : [value];
  }
  getSQL() {
    return new SQL([this]);
  }
};
var SQL = class _SQL {
  static {
    __name(this, "SQL");
  }
  constructor(queryChunks) {
    this.queryChunks = queryChunks;
    for (const chunk of queryChunks) {
      if (is(chunk, Table)) {
        const schemaName = chunk[Table.Symbol.Schema];
        this.usedTables.push(
          schemaName === void 0 ? chunk[Table.Symbol.Name] : schemaName + "." + chunk[Table.Symbol.Name]
        );
      }
    }
  }
  static [entityKind] = "SQL";
  /** @internal */
  decoder = noopDecoder;
  shouldInlineParams = false;
  /** @internal */
  usedTables = [];
  append(query) {
    this.queryChunks.push(...query.queryChunks);
    return this;
  }
  toQuery(config) {
    return tracer.startActiveSpan("drizzle.buildSQL", (span) => {
      const query = this.buildQueryFromSourceParams(this.queryChunks, config);
      span?.setAttributes({
        "drizzle.query.text": query.sql,
        "drizzle.query.params": JSON.stringify(query.params)
      });
      return query;
    });
  }
  buildQueryFromSourceParams(chunks, _config) {
    const config = Object.assign({}, _config, {
      inlineParams: _config.inlineParams || this.shouldInlineParams,
      paramStartIndex: _config.paramStartIndex || { value: 0 }
    });
    const {
      casing,
      escapeName,
      escapeParam,
      prepareTyping,
      inlineParams,
      paramStartIndex
    } = config;
    return mergeQueries(chunks.map((chunk) => {
      if (is(chunk, StringChunk)) {
        return { sql: chunk.value.join(""), params: [] };
      }
      if (is(chunk, Name)) {
        return { sql: escapeName(chunk.value), params: [] };
      }
      if (chunk === void 0) {
        return { sql: "", params: [] };
      }
      if (Array.isArray(chunk)) {
        const result = [new StringChunk("(")];
        for (const [i, p2] of chunk.entries()) {
          result.push(p2);
          if (i < chunk.length - 1) {
            result.push(new StringChunk(", "));
          }
        }
        result.push(new StringChunk(")"));
        return this.buildQueryFromSourceParams(result, config);
      }
      if (is(chunk, _SQL)) {
        return this.buildQueryFromSourceParams(chunk.queryChunks, {
          ...config,
          inlineParams: inlineParams || chunk.shouldInlineParams
        });
      }
      if (is(chunk, Table)) {
        const schemaName = chunk[Table.Symbol.Schema];
        const tableName = chunk[Table.Symbol.Name];
        return {
          sql: schemaName === void 0 || chunk[IsAlias] ? escapeName(tableName) : escapeName(schemaName) + "." + escapeName(tableName),
          params: []
        };
      }
      if (is(chunk, Column)) {
        const columnName = casing.getColumnCasing(chunk);
        if (_config.invokeSource === "indexes") {
          return { sql: escapeName(columnName), params: [] };
        }
        const schemaName = chunk.table[Table.Symbol.Schema];
        return {
          sql: chunk.table[IsAlias] || schemaName === void 0 ? escapeName(chunk.table[Table.Symbol.Name]) + "." + escapeName(columnName) : escapeName(schemaName) + "." + escapeName(chunk.table[Table.Symbol.Name]) + "." + escapeName(columnName),
          params: []
        };
      }
      if (is(chunk, View)) {
        const schemaName = chunk[ViewBaseConfig].schema;
        const viewName = chunk[ViewBaseConfig].name;
        return {
          sql: schemaName === void 0 || chunk[ViewBaseConfig].isAlias ? escapeName(viewName) : escapeName(schemaName) + "." + escapeName(viewName),
          params: []
        };
      }
      if (is(chunk, Param)) {
        if (is(chunk.value, Placeholder)) {
          return { sql: escapeParam(paramStartIndex.value++, chunk), params: [chunk], typings: ["none"] };
        }
        const mappedValue = chunk.value === null ? null : chunk.encoder.mapToDriverValue(chunk.value);
        if (is(mappedValue, _SQL)) {
          return this.buildQueryFromSourceParams([mappedValue], config);
        }
        if (inlineParams) {
          return { sql: this.mapInlineParam(mappedValue, config), params: [] };
        }
        let typings = ["none"];
        if (prepareTyping) {
          typings = [prepareTyping(chunk.encoder)];
        }
        return { sql: escapeParam(paramStartIndex.value++, mappedValue), params: [mappedValue], typings };
      }
      if (is(chunk, Placeholder)) {
        return { sql: escapeParam(paramStartIndex.value++, chunk), params: [chunk], typings: ["none"] };
      }
      if (is(chunk, _SQL.Aliased) && chunk.fieldAlias !== void 0) {
        return { sql: escapeName(chunk.fieldAlias), params: [] };
      }
      if (is(chunk, Subquery)) {
        if (chunk._.isWith) {
          return { sql: escapeName(chunk._.alias), params: [] };
        }
        return this.buildQueryFromSourceParams([
          new StringChunk("("),
          chunk._.sql,
          new StringChunk(") "),
          new Name(chunk._.alias)
        ], config);
      }
      if (isPgEnum(chunk)) {
        if (chunk.schema) {
          return { sql: escapeName(chunk.schema) + "." + escapeName(chunk.enumName), params: [] };
        }
        return { sql: escapeName(chunk.enumName), params: [] };
      }
      if (isSQLWrapper(chunk)) {
        if (chunk.shouldOmitSQLParens?.()) {
          return this.buildQueryFromSourceParams([chunk.getSQL()], config);
        }
        return this.buildQueryFromSourceParams([
          new StringChunk("("),
          chunk.getSQL(),
          new StringChunk(")")
        ], config);
      }
      if (inlineParams) {
        return { sql: this.mapInlineParam(chunk, config), params: [] };
      }
      return { sql: escapeParam(paramStartIndex.value++, chunk), params: [chunk], typings: ["none"] };
    }));
  }
  mapInlineParam(chunk, { escapeString }) {
    if (chunk === null) {
      return "null";
    }
    if (typeof chunk === "number" || typeof chunk === "boolean") {
      return chunk.toString();
    }
    if (typeof chunk === "string") {
      return escapeString(chunk);
    }
    if (typeof chunk === "object") {
      const mappedValueAsString = chunk.toString();
      if (mappedValueAsString === "[object Object]") {
        return escapeString(JSON.stringify(chunk));
      }
      return escapeString(mappedValueAsString);
    }
    throw new Error("Unexpected param value: " + chunk);
  }
  getSQL() {
    return this;
  }
  as(alias) {
    if (alias === void 0) {
      return this;
    }
    return new _SQL.Aliased(this, alias);
  }
  mapWith(decoder2) {
    this.decoder = typeof decoder2 === "function" ? { mapFromDriverValue: decoder2 } : decoder2;
    return this;
  }
  inlineParams() {
    this.shouldInlineParams = true;
    return this;
  }
  /**
   * This method is used to conditionally include a part of the query.
   *
   * @param condition - Condition to check
   * @returns itself if the condition is `true`, otherwise `undefined`
   */
  if(condition) {
    return condition ? this : void 0;
  }
};
var Name = class {
  static {
    __name(this, "Name");
  }
  constructor(value) {
    this.value = value;
  }
  static [entityKind] = "Name";
  brand;
  getSQL() {
    return new SQL([this]);
  }
};
function isDriverValueEncoder(value) {
  return typeof value === "object" && value !== null && "mapToDriverValue" in value && typeof value.mapToDriverValue === "function";
}
__name(isDriverValueEncoder, "isDriverValueEncoder");
var noopDecoder = {
  mapFromDriverValue: /* @__PURE__ */ __name((value) => value, "mapFromDriverValue")
};
var noopEncoder = {
  mapToDriverValue: /* @__PURE__ */ __name((value) => value, "mapToDriverValue")
};
var noopMapper = {
  ...noopDecoder,
  ...noopEncoder
};
var Param = class {
  static {
    __name(this, "Param");
  }
  /**
   * @param value - Parameter value
   * @param encoder - Encoder to convert the value to a driver parameter
   */
  constructor(value, encoder2 = noopEncoder) {
    this.value = value;
    this.encoder = encoder2;
  }
  static [entityKind] = "Param";
  brand;
  getSQL() {
    return new SQL([this]);
  }
};
function sql(strings, ...params) {
  const queryChunks = [];
  if (params.length > 0 || strings.length > 0 && strings[0] !== "") {
    queryChunks.push(new StringChunk(strings[0]));
  }
  for (const [paramIndex, param2] of params.entries()) {
    queryChunks.push(param2, new StringChunk(strings[paramIndex + 1]));
  }
  return new SQL(queryChunks);
}
__name(sql, "sql");
((sql2) => {
  function empty() {
    return new SQL([]);
  }
  __name(empty, "empty");
  sql2.empty = empty;
  function fromList(list) {
    return new SQL(list);
  }
  __name(fromList, "fromList");
  sql2.fromList = fromList;
  function raw3(str) {
    return new SQL([new StringChunk(str)]);
  }
  __name(raw3, "raw");
  sql2.raw = raw3;
  function join(chunks, separator) {
    const result = [];
    for (const [i, chunk] of chunks.entries()) {
      if (i > 0 && separator !== void 0) {
        result.push(separator);
      }
      result.push(chunk);
    }
    return new SQL(result);
  }
  __name(join, "join");
  sql2.join = join;
  function identifier(value) {
    return new Name(value);
  }
  __name(identifier, "identifier");
  sql2.identifier = identifier;
  function placeholder2(name2) {
    return new Placeholder(name2);
  }
  __name(placeholder2, "placeholder2");
  sql2.placeholder = placeholder2;
  function param2(value, encoder2) {
    return new Param(value, encoder2);
  }
  __name(param2, "param2");
  sql2.param = param2;
})(sql || (sql = {}));
((SQL2) => {
  class Aliased {
    static {
      __name(this, "Aliased");
    }
    constructor(sql2, fieldAlias) {
      this.sql = sql2;
      this.fieldAlias = fieldAlias;
    }
    static [entityKind] = "SQL.Aliased";
    /** @internal */
    isSelectionField = false;
    getSQL() {
      return this.sql;
    }
    /** @internal */
    clone() {
      return new Aliased(this.sql, this.fieldAlias);
    }
  }
  SQL2.Aliased = Aliased;
})(SQL || (SQL = {}));
var Placeholder = class {
  static {
    __name(this, "Placeholder");
  }
  constructor(name2) {
    this.name = name2;
  }
  static [entityKind] = "Placeholder";
  getSQL() {
    return new SQL([this]);
  }
};
function fillPlaceholders(params, values) {
  return params.map((p2) => {
    if (is(p2, Placeholder)) {
      if (!(p2.name in values)) {
        throw new Error(`No value for placeholder "${p2.name}" was provided`);
      }
      return values[p2.name];
    }
    if (is(p2, Param) && is(p2.value, Placeholder)) {
      if (!(p2.value.name in values)) {
        throw new Error(`No value for placeholder "${p2.value.name}" was provided`);
      }
      return p2.encoder.mapToDriverValue(values[p2.value.name]);
    }
    return p2;
  });
}
__name(fillPlaceholders, "fillPlaceholders");
var IsDrizzleView = Symbol.for("drizzle:IsDrizzleView");
var View = class {
  static {
    __name(this, "View");
  }
  static [entityKind] = "View";
  /** @internal */
  [ViewBaseConfig];
  /** @internal */
  [IsDrizzleView] = true;
  constructor({ name: name2, schema, selectedFields, query }) {
    this[ViewBaseConfig] = {
      name: name2,
      originalName: name2,
      schema,
      selectedFields,
      query,
      isExisting: !query,
      isAlias: false
    };
  }
  getSQL() {
    return new SQL([this]);
  }
};
Column.prototype.getSQL = function() {
  return new SQL([this]);
};
Table.prototype.getSQL = function() {
  return new SQL([this]);
};
Subquery.prototype.getSQL = function() {
  return new SQL([this]);
};

// node_modules/.pnpm/drizzle-orm@0.45.1_@libsql+client@0.17.0_@types+better-sqlite3@7.6.13_better-sqlite3@12.6.2/node_modules/drizzle-orm/alias.js
var ColumnAliasProxyHandler = class {
  static {
    __name(this, "ColumnAliasProxyHandler");
  }
  constructor(table) {
    this.table = table;
  }
  static [entityKind] = "ColumnAliasProxyHandler";
  get(columnObj, prop) {
    if (prop === "table") {
      return this.table;
    }
    return columnObj[prop];
  }
};
var TableAliasProxyHandler = class {
  static {
    __name(this, "TableAliasProxyHandler");
  }
  constructor(alias, replaceOriginalName) {
    this.alias = alias;
    this.replaceOriginalName = replaceOriginalName;
  }
  static [entityKind] = "TableAliasProxyHandler";
  get(target, prop) {
    if (prop === Table.Symbol.IsAlias) {
      return true;
    }
    if (prop === Table.Symbol.Name) {
      return this.alias;
    }
    if (this.replaceOriginalName && prop === Table.Symbol.OriginalName) {
      return this.alias;
    }
    if (prop === ViewBaseConfig) {
      return {
        ...target[ViewBaseConfig],
        name: this.alias,
        isAlias: true
      };
    }
    if (prop === Table.Symbol.Columns) {
      const columns = target[Table.Symbol.Columns];
      if (!columns) {
        return columns;
      }
      const proxiedColumns = {};
      Object.keys(columns).map((key) => {
        proxiedColumns[key] = new Proxy(
          columns[key],
          new ColumnAliasProxyHandler(new Proxy(target, this))
        );
      });
      return proxiedColumns;
    }
    const value = target[prop];
    if (is(value, Column)) {
      return new Proxy(value, new ColumnAliasProxyHandler(new Proxy(target, this)));
    }
    return value;
  }
};
var RelationTableAliasProxyHandler = class {
  static {
    __name(this, "RelationTableAliasProxyHandler");
  }
  constructor(alias) {
    this.alias = alias;
  }
  static [entityKind] = "RelationTableAliasProxyHandler";
  get(target, prop) {
    if (prop === "sourceTable") {
      return aliasedTable(target.sourceTable, this.alias);
    }
    return target[prop];
  }
};
function aliasedTable(table, tableAlias) {
  return new Proxy(table, new TableAliasProxyHandler(tableAlias, false));
}
__name(aliasedTable, "aliasedTable");
function aliasedTableColumn(column, tableAlias) {
  return new Proxy(
    column,
    new ColumnAliasProxyHandler(new Proxy(column.table, new TableAliasProxyHandler(tableAlias, false)))
  );
}
__name(aliasedTableColumn, "aliasedTableColumn");
function mapColumnsInAliasedSQLToAlias(query, alias) {
  return new SQL.Aliased(mapColumnsInSQLToAlias(query.sql, alias), query.fieldAlias);
}
__name(mapColumnsInAliasedSQLToAlias, "mapColumnsInAliasedSQLToAlias");
function mapColumnsInSQLToAlias(query, alias) {
  return sql.join(query.queryChunks.map((c) => {
    if (is(c, Column)) {
      return aliasedTableColumn(c, alias);
    }
    if (is(c, SQL)) {
      return mapColumnsInSQLToAlias(c, alias);
    }
    if (is(c, SQL.Aliased)) {
      return mapColumnsInAliasedSQLToAlias(c, alias);
    }
    return c;
  }));
}
__name(mapColumnsInSQLToAlias, "mapColumnsInSQLToAlias");

// node_modules/.pnpm/drizzle-orm@0.45.1_@libsql+client@0.17.0_@types+better-sqlite3@7.6.13_better-sqlite3@12.6.2/node_modules/drizzle-orm/utils.js
function mapResultRow(columns, row, joinsNotNullableMap) {
  const nullifyMap = {};
  const result = columns.reduce(
    (result2, { path, field }, columnIndex) => {
      let decoder2;
      if (is(field, Column)) {
        decoder2 = field;
      } else if (is(field, SQL)) {
        decoder2 = field.decoder;
      } else if (is(field, Subquery)) {
        decoder2 = field._.sql.decoder;
      } else {
        decoder2 = field.sql.decoder;
      }
      let node = result2;
      for (const [pathChunkIndex, pathChunk] of path.entries()) {
        if (pathChunkIndex < path.length - 1) {
          if (!(pathChunk in node)) {
            node[pathChunk] = {};
          }
          node = node[pathChunk];
        } else {
          const rawValue = row[columnIndex];
          const value = node[pathChunk] = rawValue === null ? null : decoder2.mapFromDriverValue(rawValue);
          if (joinsNotNullableMap && is(field, Column) && path.length === 2) {
            const objectName = path[0];
            if (!(objectName in nullifyMap)) {
              nullifyMap[objectName] = value === null ? getTableName(field.table) : false;
            } else if (typeof nullifyMap[objectName] === "string" && nullifyMap[objectName] !== getTableName(field.table)) {
              nullifyMap[objectName] = false;
            }
          }
        }
      }
      return result2;
    },
    {}
  );
  if (joinsNotNullableMap && Object.keys(nullifyMap).length > 0) {
    for (const [objectName, tableName] of Object.entries(nullifyMap)) {
      if (typeof tableName === "string" && !joinsNotNullableMap[tableName]) {
        result[objectName] = null;
      }
    }
  }
  return result;
}
__name(mapResultRow, "mapResultRow");
function orderSelectedFields(fields, pathPrefix) {
  return Object.entries(fields).reduce((result, [name, field]) => {
    if (typeof name !== "string") {
      return result;
    }
    const newPath = pathPrefix ? [...pathPrefix, name] : [name];
    if (is(field, Column) || is(field, SQL) || is(field, SQL.Aliased) || is(field, Subquery)) {
      result.push({ path: newPath, field });
    } else if (is(field, Table)) {
      result.push(...orderSelectedFields(field[Table.Symbol.Columns], newPath));
    } else {
      result.push(...orderSelectedFields(field, newPath));
    }
    return result;
  }, []);
}
__name(orderSelectedFields, "orderSelectedFields");
function haveSameKeys(left, right) {
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  if (leftKeys.length !== rightKeys.length) {
    return false;
  }
  for (const [index2, key] of leftKeys.entries()) {
    if (key !== rightKeys[index2]) {
      return false;
    }
  }
  return true;
}
__name(haveSameKeys, "haveSameKeys");
function mapUpdateSet(table, values) {
  const entries = Object.entries(values).filter(([, value]) => value !== void 0).map(([key, value]) => {
    if (is(value, SQL) || is(value, Column)) {
      return [key, value];
    } else {
      return [key, new Param(value, table[Table.Symbol.Columns][key])];
    }
  });
  if (entries.length === 0) {
    throw new Error("No values to set");
  }
  return Object.fromEntries(entries);
}
__name(mapUpdateSet, "mapUpdateSet");
function applyMixins(baseClass, extendedClasses) {
  for (const extendedClass of extendedClasses) {
    for (const name of Object.getOwnPropertyNames(extendedClass.prototype)) {
      if (name === "constructor") continue;
      Object.defineProperty(
        baseClass.prototype,
        name,
        Object.getOwnPropertyDescriptor(extendedClass.prototype, name) || /* @__PURE__ */ Object.create(null)
      );
    }
  }
}
__name(applyMixins, "applyMixins");
function getTableColumns(table) {
  return table[Table.Symbol.Columns];
}
__name(getTableColumns, "getTableColumns");
function getTableLikeName(table) {
  return is(table, Subquery) ? table._.alias : is(table, View) ? table[ViewBaseConfig].name : is(table, SQL) ? void 0 : table[Table.Symbol.IsAlias] ? table[Table.Symbol.Name] : table[Table.Symbol.BaseName];
}
__name(getTableLikeName, "getTableLikeName");
function getColumnNameAndConfig(a, b2) {
  return {
    name: typeof a === "string" && a.length > 0 ? a : "",
    config: typeof a === "object" ? a : b2
  };
}
__name(getColumnNameAndConfig, "getColumnNameAndConfig");
function isConfig(data) {
  if (typeof data !== "object" || data === null) return false;
  if (data.constructor.name !== "Object") return false;
  if ("logger" in data) {
    const type = typeof data["logger"];
    if (type !== "boolean" && (type !== "object" || typeof data["logger"]["logQuery"] !== "function") && type !== "undefined") return false;
    return true;
  }
  if ("schema" in data) {
    const type = typeof data["schema"];
    if (type !== "object" && type !== "undefined") return false;
    return true;
  }
  if ("casing" in data) {
    const type = typeof data["casing"];
    if (type !== "string" && type !== "undefined") return false;
    return true;
  }
  if ("mode" in data) {
    if (data["mode"] !== "default" || data["mode"] !== "planetscale" || data["mode"] !== void 0) return false;
    return true;
  }
  if ("connection" in data) {
    const type = typeof data["connection"];
    if (type !== "string" && type !== "object" && type !== "undefined") return false;
    return true;
  }
  if ("client" in data) {
    const type = typeof data["client"];
    if (type !== "object" && type !== "function" && type !== "undefined") return false;
    return true;
  }
  if (Object.keys(data).length === 0) return true;
  return false;
}
__name(isConfig, "isConfig");
var textDecoder = typeof TextDecoder === "undefined" ? null : new TextDecoder();

// node_modules/.pnpm/drizzle-orm@0.45.1_@libsql+client@0.17.0_@types+better-sqlite3@7.6.13_better-sqlite3@12.6.2/node_modules/drizzle-orm/sqlite-core/foreign-keys.js
var ForeignKeyBuilder2 = class {
  static {
    __name(this, "ForeignKeyBuilder");
  }
  static [entityKind] = "SQLiteForeignKeyBuilder";
  /** @internal */
  reference;
  /** @internal */
  _onUpdate;
  /** @internal */
  _onDelete;
  constructor(config, actions) {
    this.reference = () => {
      const { name, columns, foreignColumns } = config();
      return { name, columns, foreignTable: foreignColumns[0].table, foreignColumns };
    };
    if (actions) {
      this._onUpdate = actions.onUpdate;
      this._onDelete = actions.onDelete;
    }
  }
  onUpdate(action) {
    this._onUpdate = action;
    return this;
  }
  onDelete(action) {
    this._onDelete = action;
    return this;
  }
  /** @internal */
  build(table) {
    return new ForeignKey2(table, this);
  }
};
var ForeignKey2 = class {
  static {
    __name(this, "ForeignKey");
  }
  constructor(table, builder) {
    this.table = table;
    this.reference = builder.reference;
    this.onUpdate = builder._onUpdate;
    this.onDelete = builder._onDelete;
  }
  static [entityKind] = "SQLiteForeignKey";
  reference;
  onUpdate;
  onDelete;
  getName() {
    const { name, columns, foreignColumns } = this.reference();
    const columnNames = columns.map((column) => column.name);
    const foreignColumnNames = foreignColumns.map((column) => column.name);
    const chunks = [
      this.table[TableName],
      ...columnNames,
      foreignColumns[0].table[TableName],
      ...foreignColumnNames
    ];
    return name ?? `${chunks.join("_")}_fk`;
  }
};

// node_modules/.pnpm/drizzle-orm@0.45.1_@libsql+client@0.17.0_@types+better-sqlite3@7.6.13_better-sqlite3@12.6.2/node_modules/drizzle-orm/sqlite-core/unique-constraint.js
function uniqueKeyName2(table, columns) {
  return `${table[TableName]}_${columns.join("_")}_unique`;
}
__name(uniqueKeyName2, "uniqueKeyName");
var UniqueConstraintBuilder2 = class {
  static {
    __name(this, "UniqueConstraintBuilder");
  }
  constructor(columns, name) {
    this.name = name;
    this.columns = columns;
  }
  static [entityKind] = "SQLiteUniqueConstraintBuilder";
  /** @internal */
  columns;
  /** @internal */
  build(table) {
    return new UniqueConstraint2(table, this.columns, this.name);
  }
};
var UniqueOnConstraintBuilder2 = class {
  static {
    __name(this, "UniqueOnConstraintBuilder");
  }
  static [entityKind] = "SQLiteUniqueOnConstraintBuilder";
  /** @internal */
  name;
  constructor(name) {
    this.name = name;
  }
  on(...columns) {
    return new UniqueConstraintBuilder2(columns, this.name);
  }
};
var UniqueConstraint2 = class {
  static {
    __name(this, "UniqueConstraint");
  }
  constructor(table, columns, name) {
    this.table = table;
    this.columns = columns;
    this.name = name ?? uniqueKeyName2(this.table, this.columns.map((column) => column.name));
  }
  static [entityKind] = "SQLiteUniqueConstraint";
  columns;
  name;
  getName() {
    return this.name;
  }
};

// node_modules/.pnpm/drizzle-orm@0.45.1_@libsql+client@0.17.0_@types+better-sqlite3@7.6.13_better-sqlite3@12.6.2/node_modules/drizzle-orm/sqlite-core/columns/common.js
var SQLiteColumnBuilder = class extends ColumnBuilder {
  static {
    __name(this, "SQLiteColumnBuilder");
  }
  static [entityKind] = "SQLiteColumnBuilder";
  foreignKeyConfigs = [];
  references(ref, actions = {}) {
    this.foreignKeyConfigs.push({ ref, actions });
    return this;
  }
  unique(name) {
    this.config.isUnique = true;
    this.config.uniqueName = name;
    return this;
  }
  generatedAlwaysAs(as, config) {
    this.config.generated = {
      as,
      type: "always",
      mode: config?.mode ?? "virtual"
    };
    return this;
  }
  /** @internal */
  buildForeignKeys(column, table) {
    return this.foreignKeyConfigs.map(({ ref, actions }) => {
      return ((ref2, actions2) => {
        const builder = new ForeignKeyBuilder2(() => {
          const foreignColumn = ref2();
          return { columns: [column], foreignColumns: [foreignColumn] };
        });
        if (actions2.onUpdate) {
          builder.onUpdate(actions2.onUpdate);
        }
        if (actions2.onDelete) {
          builder.onDelete(actions2.onDelete);
        }
        return builder.build(table);
      })(ref, actions);
    });
  }
};
var SQLiteColumn = class extends Column {
  static {
    __name(this, "SQLiteColumn");
  }
  constructor(table, config) {
    if (!config.uniqueName) {
      config.uniqueName = uniqueKeyName2(table, [config.name]);
    }
    super(table, config);
    this.table = table;
  }
  static [entityKind] = "SQLiteColumn";
};

// node_modules/.pnpm/drizzle-orm@0.45.1_@libsql+client@0.17.0_@types+better-sqlite3@7.6.13_better-sqlite3@12.6.2/node_modules/drizzle-orm/sqlite-core/columns/blob.js
var SQLiteBigIntBuilder = class extends SQLiteColumnBuilder {
  static {
    __name(this, "SQLiteBigIntBuilder");
  }
  static [entityKind] = "SQLiteBigIntBuilder";
  constructor(name) {
    super(name, "bigint", "SQLiteBigInt");
  }
  /** @internal */
  build(table) {
    return new SQLiteBigInt(table, this.config);
  }
};
var SQLiteBigInt = class extends SQLiteColumn {
  static {
    __name(this, "SQLiteBigInt");
  }
  static [entityKind] = "SQLiteBigInt";
  getSQLType() {
    return "blob";
  }
  mapFromDriverValue(value) {
    if (typeof Buffer !== "undefined" && Buffer.from) {
      const buf = Buffer.isBuffer(value) ? value : value instanceof ArrayBuffer ? Buffer.from(value) : value.buffer ? Buffer.from(value.buffer, value.byteOffset, value.byteLength) : Buffer.from(value);
      return BigInt(buf.toString("utf8"));
    }
    return BigInt(textDecoder.decode(value));
  }
  mapToDriverValue(value) {
    return Buffer.from(value.toString());
  }
};
var SQLiteBlobJsonBuilder = class extends SQLiteColumnBuilder {
  static {
    __name(this, "SQLiteBlobJsonBuilder");
  }
  static [entityKind] = "SQLiteBlobJsonBuilder";
  constructor(name) {
    super(name, "json", "SQLiteBlobJson");
  }
  /** @internal */
  build(table) {
    return new SQLiteBlobJson(
      table,
      this.config
    );
  }
};
var SQLiteBlobJson = class extends SQLiteColumn {
  static {
    __name(this, "SQLiteBlobJson");
  }
  static [entityKind] = "SQLiteBlobJson";
  getSQLType() {
    return "blob";
  }
  mapFromDriverValue(value) {
    if (typeof Buffer !== "undefined" && Buffer.from) {
      const buf = Buffer.isBuffer(value) ? value : value instanceof ArrayBuffer ? Buffer.from(value) : value.buffer ? Buffer.from(value.buffer, value.byteOffset, value.byteLength) : Buffer.from(value);
      return JSON.parse(buf.toString("utf8"));
    }
    return JSON.parse(textDecoder.decode(value));
  }
  mapToDriverValue(value) {
    return Buffer.from(JSON.stringify(value));
  }
};
var SQLiteBlobBufferBuilder = class extends SQLiteColumnBuilder {
  static {
    __name(this, "SQLiteBlobBufferBuilder");
  }
  static [entityKind] = "SQLiteBlobBufferBuilder";
  constructor(name) {
    super(name, "buffer", "SQLiteBlobBuffer");
  }
  /** @internal */
  build(table) {
    return new SQLiteBlobBuffer(table, this.config);
  }
};
var SQLiteBlobBuffer = class extends SQLiteColumn {
  static {
    __name(this, "SQLiteBlobBuffer");
  }
  static [entityKind] = "SQLiteBlobBuffer";
  mapFromDriverValue(value) {
    if (Buffer.isBuffer(value)) {
      return value;
    }
    return Buffer.from(value);
  }
  getSQLType() {
    return "blob";
  }
};
function blob(a, b2) {
  const { name, config } = getColumnNameAndConfig(a, b2);
  if (config?.mode === "json") {
    return new SQLiteBlobJsonBuilder(name);
  }
  if (config?.mode === "bigint") {
    return new SQLiteBigIntBuilder(name);
  }
  return new SQLiteBlobBufferBuilder(name);
}
__name(blob, "blob");

// node_modules/.pnpm/drizzle-orm@0.45.1_@libsql+client@0.17.0_@types+better-sqlite3@7.6.13_better-sqlite3@12.6.2/node_modules/drizzle-orm/sqlite-core/columns/custom.js
var SQLiteCustomColumnBuilder = class extends SQLiteColumnBuilder {
  static {
    __name(this, "SQLiteCustomColumnBuilder");
  }
  static [entityKind] = "SQLiteCustomColumnBuilder";
  constructor(name, fieldConfig, customTypeParams) {
    super(name, "custom", "SQLiteCustomColumn");
    this.config.fieldConfig = fieldConfig;
    this.config.customTypeParams = customTypeParams;
  }
  /** @internal */
  build(table) {
    return new SQLiteCustomColumn(
      table,
      this.config
    );
  }
};
var SQLiteCustomColumn = class extends SQLiteColumn {
  static {
    __name(this, "SQLiteCustomColumn");
  }
  static [entityKind] = "SQLiteCustomColumn";
  sqlName;
  mapTo;
  mapFrom;
  constructor(table, config) {
    super(table, config);
    this.sqlName = config.customTypeParams.dataType(config.fieldConfig);
    this.mapTo = config.customTypeParams.toDriver;
    this.mapFrom = config.customTypeParams.fromDriver;
  }
  getSQLType() {
    return this.sqlName;
  }
  mapFromDriverValue(value) {
    return typeof this.mapFrom === "function" ? this.mapFrom(value) : value;
  }
  mapToDriverValue(value) {
    return typeof this.mapTo === "function" ? this.mapTo(value) : value;
  }
};
function customType(customTypeParams) {
  return (a, b2) => {
    const { name, config } = getColumnNameAndConfig(a, b2);
    return new SQLiteCustomColumnBuilder(
      name,
      config,
      customTypeParams
    );
  };
}
__name(customType, "customType");

// node_modules/.pnpm/drizzle-orm@0.45.1_@libsql+client@0.17.0_@types+better-sqlite3@7.6.13_better-sqlite3@12.6.2/node_modules/drizzle-orm/sqlite-core/columns/integer.js
var SQLiteBaseIntegerBuilder = class extends SQLiteColumnBuilder {
  static {
    __name(this, "SQLiteBaseIntegerBuilder");
  }
  static [entityKind] = "SQLiteBaseIntegerBuilder";
  constructor(name, dataType, columnType) {
    super(name, dataType, columnType);
    this.config.autoIncrement = false;
  }
  primaryKey(config) {
    if (config?.autoIncrement) {
      this.config.autoIncrement = true;
    }
    this.config.hasDefault = true;
    return super.primaryKey();
  }
};
var SQLiteBaseInteger = class extends SQLiteColumn {
  static {
    __name(this, "SQLiteBaseInteger");
  }
  static [entityKind] = "SQLiteBaseInteger";
  autoIncrement = this.config.autoIncrement;
  getSQLType() {
    return "integer";
  }
};
var SQLiteIntegerBuilder = class extends SQLiteBaseIntegerBuilder {
  static {
    __name(this, "SQLiteIntegerBuilder");
  }
  static [entityKind] = "SQLiteIntegerBuilder";
  constructor(name) {
    super(name, "number", "SQLiteInteger");
  }
  build(table) {
    return new SQLiteInteger(
      table,
      this.config
    );
  }
};
var SQLiteInteger = class extends SQLiteBaseInteger {
  static {
    __name(this, "SQLiteInteger");
  }
  static [entityKind] = "SQLiteInteger";
};
var SQLiteTimestampBuilder = class extends SQLiteBaseIntegerBuilder {
  static {
    __name(this, "SQLiteTimestampBuilder");
  }
  static [entityKind] = "SQLiteTimestampBuilder";
  constructor(name, mode) {
    super(name, "date", "SQLiteTimestamp");
    this.config.mode = mode;
  }
  /**
   * @deprecated Use `default()` with your own expression instead.
   *
   * Adds `DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer))` to the column, which is the current epoch timestamp in milliseconds.
   */
  defaultNow() {
    return this.default(sql`(cast((julianday('now') - 2440587.5)*86400000 as integer))`);
  }
  build(table) {
    return new SQLiteTimestamp(
      table,
      this.config
    );
  }
};
var SQLiteTimestamp = class extends SQLiteBaseInteger {
  static {
    __name(this, "SQLiteTimestamp");
  }
  static [entityKind] = "SQLiteTimestamp";
  mode = this.config.mode;
  mapFromDriverValue(value) {
    if (this.config.mode === "timestamp") {
      return new Date(value * 1e3);
    }
    return new Date(value);
  }
  mapToDriverValue(value) {
    const unix = value.getTime();
    if (this.config.mode === "timestamp") {
      return Math.floor(unix / 1e3);
    }
    return unix;
  }
};
var SQLiteBooleanBuilder = class extends SQLiteBaseIntegerBuilder {
  static {
    __name(this, "SQLiteBooleanBuilder");
  }
  static [entityKind] = "SQLiteBooleanBuilder";
  constructor(name, mode) {
    super(name, "boolean", "SQLiteBoolean");
    this.config.mode = mode;
  }
  build(table) {
    return new SQLiteBoolean(
      table,
      this.config
    );
  }
};
var SQLiteBoolean = class extends SQLiteBaseInteger {
  static {
    __name(this, "SQLiteBoolean");
  }
  static [entityKind] = "SQLiteBoolean";
  mode = this.config.mode;
  mapFromDriverValue(value) {
    return Number(value) === 1;
  }
  mapToDriverValue(value) {
    return value ? 1 : 0;
  }
};
function integer(a, b2) {
  const { name, config } = getColumnNameAndConfig(a, b2);
  if (config?.mode === "timestamp" || config?.mode === "timestamp_ms") {
    return new SQLiteTimestampBuilder(name, config.mode);
  }
  if (config?.mode === "boolean") {
    return new SQLiteBooleanBuilder(name, config.mode);
  }
  return new SQLiteIntegerBuilder(name);
}
__name(integer, "integer");

// node_modules/.pnpm/drizzle-orm@0.45.1_@libsql+client@0.17.0_@types+better-sqlite3@7.6.13_better-sqlite3@12.6.2/node_modules/drizzle-orm/sqlite-core/columns/numeric.js
var SQLiteNumericBuilder = class extends SQLiteColumnBuilder {
  static {
    __name(this, "SQLiteNumericBuilder");
  }
  static [entityKind] = "SQLiteNumericBuilder";
  constructor(name) {
    super(name, "string", "SQLiteNumeric");
  }
  /** @internal */
  build(table) {
    return new SQLiteNumeric(
      table,
      this.config
    );
  }
};
var SQLiteNumeric = class extends SQLiteColumn {
  static {
    __name(this, "SQLiteNumeric");
  }
  static [entityKind] = "SQLiteNumeric";
  mapFromDriverValue(value) {
    if (typeof value === "string") return value;
    return String(value);
  }
  getSQLType() {
    return "numeric";
  }
};
var SQLiteNumericNumberBuilder = class extends SQLiteColumnBuilder {
  static {
    __name(this, "SQLiteNumericNumberBuilder");
  }
  static [entityKind] = "SQLiteNumericNumberBuilder";
  constructor(name) {
    super(name, "number", "SQLiteNumericNumber");
  }
  /** @internal */
  build(table) {
    return new SQLiteNumericNumber(
      table,
      this.config
    );
  }
};
var SQLiteNumericNumber = class extends SQLiteColumn {
  static {
    __name(this, "SQLiteNumericNumber");
  }
  static [entityKind] = "SQLiteNumericNumber";
  mapFromDriverValue(value) {
    if (typeof value === "number") return value;
    return Number(value);
  }
  mapToDriverValue = String;
  getSQLType() {
    return "numeric";
  }
};
var SQLiteNumericBigIntBuilder = class extends SQLiteColumnBuilder {
  static {
    __name(this, "SQLiteNumericBigIntBuilder");
  }
  static [entityKind] = "SQLiteNumericBigIntBuilder";
  constructor(name) {
    super(name, "bigint", "SQLiteNumericBigInt");
  }
  /** @internal */
  build(table) {
    return new SQLiteNumericBigInt(
      table,
      this.config
    );
  }
};
var SQLiteNumericBigInt = class extends SQLiteColumn {
  static {
    __name(this, "SQLiteNumericBigInt");
  }
  static [entityKind] = "SQLiteNumericBigInt";
  mapFromDriverValue = BigInt;
  mapToDriverValue = String;
  getSQLType() {
    return "numeric";
  }
};
function numeric(a, b2) {
  const { name, config } = getColumnNameAndConfig(a, b2);
  const mode = config?.mode;
  return mode === "number" ? new SQLiteNumericNumberBuilder(name) : mode === "bigint" ? new SQLiteNumericBigIntBuilder(name) : new SQLiteNumericBuilder(name);
}
__name(numeric, "numeric");

// node_modules/.pnpm/drizzle-orm@0.45.1_@libsql+client@0.17.0_@types+better-sqlite3@7.6.13_better-sqlite3@12.6.2/node_modules/drizzle-orm/sqlite-core/columns/real.js
var SQLiteRealBuilder = class extends SQLiteColumnBuilder {
  static {
    __name(this, "SQLiteRealBuilder");
  }
  static [entityKind] = "SQLiteRealBuilder";
  constructor(name) {
    super(name, "number", "SQLiteReal");
  }
  /** @internal */
  build(table) {
    return new SQLiteReal(table, this.config);
  }
};
var SQLiteReal = class extends SQLiteColumn {
  static {
    __name(this, "SQLiteReal");
  }
  static [entityKind] = "SQLiteReal";
  getSQLType() {
    return "real";
  }
};
function real(name) {
  return new SQLiteRealBuilder(name ?? "");
}
__name(real, "real");

// node_modules/.pnpm/drizzle-orm@0.45.1_@libsql+client@0.17.0_@types+better-sqlite3@7.6.13_better-sqlite3@12.6.2/node_modules/drizzle-orm/sqlite-core/columns/text.js
var SQLiteTextBuilder = class extends SQLiteColumnBuilder {
  static {
    __name(this, "SQLiteTextBuilder");
  }
  static [entityKind] = "SQLiteTextBuilder";
  constructor(name, config) {
    super(name, "string", "SQLiteText");
    this.config.enumValues = config.enum;
    this.config.length = config.length;
  }
  /** @internal */
  build(table) {
    return new SQLiteText(
      table,
      this.config
    );
  }
};
var SQLiteText = class extends SQLiteColumn {
  static {
    __name(this, "SQLiteText");
  }
  static [entityKind] = "SQLiteText";
  enumValues = this.config.enumValues;
  length = this.config.length;
  constructor(table, config) {
    super(table, config);
  }
  getSQLType() {
    return `text${this.config.length ? `(${this.config.length})` : ""}`;
  }
};
var SQLiteTextJsonBuilder = class extends SQLiteColumnBuilder {
  static {
    __name(this, "SQLiteTextJsonBuilder");
  }
  static [entityKind] = "SQLiteTextJsonBuilder";
  constructor(name) {
    super(name, "json", "SQLiteTextJson");
  }
  /** @internal */
  build(table) {
    return new SQLiteTextJson(
      table,
      this.config
    );
  }
};
var SQLiteTextJson = class extends SQLiteColumn {
  static {
    __name(this, "SQLiteTextJson");
  }
  static [entityKind] = "SQLiteTextJson";
  getSQLType() {
    return "text";
  }
  mapFromDriverValue(value) {
    return JSON.parse(value);
  }
  mapToDriverValue(value) {
    return JSON.stringify(value);
  }
};
function text(a, b2 = {}) {
  const { name, config } = getColumnNameAndConfig(a, b2);
  if (config.mode === "json") {
    return new SQLiteTextJsonBuilder(name);
  }
  return new SQLiteTextBuilder(name, config);
}
__name(text, "text");

// node_modules/.pnpm/drizzle-orm@0.45.1_@libsql+client@0.17.0_@types+better-sqlite3@7.6.13_better-sqlite3@12.6.2/node_modules/drizzle-orm/selection-proxy.js
var SelectionProxyHandler = class _SelectionProxyHandler {
  static {
    __name(this, "SelectionProxyHandler");
  }
  static [entityKind] = "SelectionProxyHandler";
  config;
  constructor(config) {
    this.config = { ...config };
  }
  get(subquery, prop) {
    if (prop === "_") {
      return {
        ...subquery["_"],
        selectedFields: new Proxy(
          subquery._.selectedFields,
          this
        )
      };
    }
    if (prop === ViewBaseConfig) {
      return {
        ...subquery[ViewBaseConfig],
        selectedFields: new Proxy(
          subquery[ViewBaseConfig].selectedFields,
          this
        )
      };
    }
    if (typeof prop === "symbol") {
      return subquery[prop];
    }
    const columns = is(subquery, Subquery) ? subquery._.selectedFields : is(subquery, View) ? subquery[ViewBaseConfig].selectedFields : subquery;
    const value = columns[prop];
    if (is(value, SQL.Aliased)) {
      if (this.config.sqlAliasedBehavior === "sql" && !value.isSelectionField) {
        return value.sql;
      }
      const newValue = value.clone();
      newValue.isSelectionField = true;
      return newValue;
    }
    if (is(value, SQL)) {
      if (this.config.sqlBehavior === "sql") {
        return value;
      }
      throw new Error(
        `You tried to reference "${prop}" field from a subquery, which is a raw SQL field, but it doesn't have an alias declared. Please add an alias to the field using ".as('alias')" method.`
      );
    }
    if (is(value, Column)) {
      if (this.config.alias) {
        return new Proxy(
          value,
          new ColumnAliasProxyHandler(
            new Proxy(
              value.table,
              new TableAliasProxyHandler(this.config.alias, this.config.replaceOriginalName ?? false)
            )
          )
        );
      }
      return value;
    }
    if (typeof value !== "object" || value === null) {
      return value;
    }
    return new Proxy(value, new _SelectionProxyHandler(this.config));
  }
};

// node_modules/.pnpm/drizzle-orm@0.45.1_@libsql+client@0.17.0_@types+better-sqlite3@7.6.13_better-sqlite3@12.6.2/node_modules/drizzle-orm/query-promise.js
var QueryPromise = class {
  static {
    __name(this, "QueryPromise");
  }
  static [entityKind] = "QueryPromise";
  [Symbol.toStringTag] = "QueryPromise";
  catch(onRejected) {
    return this.then(void 0, onRejected);
  }
  finally(onFinally) {
    return this.then(
      (value) => {
        onFinally?.();
        return value;
      },
      (reason) => {
        onFinally?.();
        throw reason;
      }
    );
  }
  then(onFulfilled, onRejected) {
    return this.execute().then(onFulfilled, onRejected);
  }
};

// node_modules/.pnpm/drizzle-orm@0.45.1_@libsql+client@0.17.0_@types+better-sqlite3@7.6.13_better-sqlite3@12.6.2/node_modules/drizzle-orm/sqlite-core/columns/all.js
function getSQLiteColumnBuilders() {
  return {
    blob,
    customType,
    integer,
    numeric,
    real,
    text
  };
}
__name(getSQLiteColumnBuilders, "getSQLiteColumnBuilders");

// node_modules/.pnpm/drizzle-orm@0.45.1_@libsql+client@0.17.0_@types+better-sqlite3@7.6.13_better-sqlite3@12.6.2/node_modules/drizzle-orm/sqlite-core/table.js
var InlineForeignKeys = Symbol.for("drizzle:SQLiteInlineForeignKeys");
var SQLiteTable = class extends Table {
  static {
    __name(this, "SQLiteTable");
  }
  static [entityKind] = "SQLiteTable";
  /** @internal */
  static Symbol = Object.assign({}, Table.Symbol, {
    InlineForeignKeys
  });
  /** @internal */
  [Table.Symbol.Columns];
  /** @internal */
  [InlineForeignKeys] = [];
  /** @internal */
  [Table.Symbol.ExtraConfigBuilder] = void 0;
};
function sqliteTableBase(name, columns, extraConfig, schema, baseName = name) {
  const rawTable = new SQLiteTable(name, schema, baseName);
  const parsedColumns = typeof columns === "function" ? columns(getSQLiteColumnBuilders()) : columns;
  const builtColumns = Object.fromEntries(
    Object.entries(parsedColumns).map(([name2, colBuilderBase]) => {
      const colBuilder = colBuilderBase;
      colBuilder.setName(name2);
      const column = colBuilder.build(rawTable);
      rawTable[InlineForeignKeys].push(...colBuilder.buildForeignKeys(column, rawTable));
      return [name2, column];
    })
  );
  const table = Object.assign(rawTable, builtColumns);
  table[Table.Symbol.Columns] = builtColumns;
  table[Table.Symbol.ExtraConfigColumns] = builtColumns;
  if (extraConfig) {
    table[SQLiteTable.Symbol.ExtraConfigBuilder] = extraConfig;
  }
  return table;
}
__name(sqliteTableBase, "sqliteTableBase");
var sqliteTable = /* @__PURE__ */ __name((name, columns, extraConfig) => {
  return sqliteTableBase(name, columns, extraConfig);
}, "sqliteTable");

// node_modules/.pnpm/drizzle-orm@0.45.1_@libsql+client@0.17.0_@types+better-sqlite3@7.6.13_better-sqlite3@12.6.2/node_modules/drizzle-orm/sqlite-core/indexes.js
var IndexBuilderOn = class {
  static {
    __name(this, "IndexBuilderOn");
  }
  constructor(name, unique) {
    this.name = name;
    this.unique = unique;
  }
  static [entityKind] = "SQLiteIndexBuilderOn";
  on(...columns) {
    return new IndexBuilder(this.name, columns, this.unique);
  }
};
var IndexBuilder = class {
  static {
    __name(this, "IndexBuilder");
  }
  static [entityKind] = "SQLiteIndexBuilder";
  /** @internal */
  config;
  constructor(name, columns, unique) {
    this.config = {
      name,
      columns,
      unique,
      where: void 0
    };
  }
  /**
   * Condition for partial index.
   */
  where(condition) {
    this.config.where = condition;
    return this;
  }
  /** @internal */
  build(table) {
    return new Index(this.config, table);
  }
};
var Index = class {
  static {
    __name(this, "Index");
  }
  static [entityKind] = "SQLiteIndex";
  config;
  constructor(config, table) {
    this.config = { ...config, table };
  }
};
function index(name) {
  return new IndexBuilderOn(name, false);
}
__name(index, "index");

// node_modules/.pnpm/drizzle-orm@0.45.1_@libsql+client@0.17.0_@types+better-sqlite3@7.6.13_better-sqlite3@12.6.2/node_modules/drizzle-orm/sqlite-core/primary-keys.js
function primaryKey(...config) {
  if (config[0].columns) {
    return new PrimaryKeyBuilder(config[0].columns, config[0].name);
  }
  return new PrimaryKeyBuilder(config);
}
__name(primaryKey, "primaryKey");
var PrimaryKeyBuilder = class {
  static {
    __name(this, "PrimaryKeyBuilder");
  }
  static [entityKind] = "SQLitePrimaryKeyBuilder";
  /** @internal */
  columns;
  /** @internal */
  name;
  constructor(columns, name) {
    this.columns = columns;
    this.name = name;
  }
  /** @internal */
  build(table) {
    return new PrimaryKey(table, this.columns, this.name);
  }
};
var PrimaryKey = class {
  static {
    __name(this, "PrimaryKey");
  }
  constructor(table, columns, name) {
    this.table = table;
    this.columns = columns;
    this.name = name;
  }
  static [entityKind] = "SQLitePrimaryKey";
  columns;
  name;
  getName() {
    return this.name ?? `${this.table[SQLiteTable.Symbol.Name]}_${this.columns.map((column) => column.name).join("_")}_pk`;
  }
};

// node_modules/.pnpm/drizzle-orm@0.45.1_@libsql+client@0.17.0_@types+better-sqlite3@7.6.13_better-sqlite3@12.6.2/node_modules/drizzle-orm/sqlite-core/utils.js
function extractUsedTable(table) {
  if (is(table, SQLiteTable)) {
    return [`${table[Table.Symbol.BaseName]}`];
  }
  if (is(table, Subquery)) {
    return table._.usedTables ?? [];
  }
  if (is(table, SQL)) {
    return table.usedTables ?? [];
  }
  return [];
}
__name(extractUsedTable, "extractUsedTable");

// node_modules/.pnpm/drizzle-orm@0.45.1_@libsql+client@0.17.0_@types+better-sqlite3@7.6.13_better-sqlite3@12.6.2/node_modules/drizzle-orm/sqlite-core/query-builders/delete.js
var SQLiteDeleteBase = class extends QueryPromise {
  static {
    __name(this, "SQLiteDeleteBase");
  }
  constructor(table, session, dialect, withList) {
    super();
    this.table = table;
    this.session = session;
    this.dialect = dialect;
    this.config = { table, withList };
  }
  static [entityKind] = "SQLiteDelete";
  /** @internal */
  config;
  /**
   * Adds a `where` clause to the query.
   *
   * Calling this method will delete only those rows that fulfill a specified condition.
   *
   * See docs: {@link https://orm.drizzle.team/docs/delete}
   *
   * @param where the `where` clause.
   *
   * @example
   * You can use conditional operators and `sql function` to filter the rows to be deleted.
   *
   * ```ts
   * // Delete all cars with green color
   * db.delete(cars).where(eq(cars.color, 'green'));
   * // or
   * db.delete(cars).where(sql`${cars.color} = 'green'`)
   * ```
   *
   * You can logically combine conditional operators with `and()` and `or()` operators:
   *
   * ```ts
   * // Delete all BMW cars with a green color
   * db.delete(cars).where(and(eq(cars.color, 'green'), eq(cars.brand, 'BMW')));
   *
   * // Delete all cars with the green or blue color
   * db.delete(cars).where(or(eq(cars.color, 'green'), eq(cars.color, 'blue')));
   * ```
   */
  where(where) {
    this.config.where = where;
    return this;
  }
  orderBy(...columns) {
    if (typeof columns[0] === "function") {
      const orderBy = columns[0](
        new Proxy(
          this.config.table[Table.Symbol.Columns],
          new SelectionProxyHandler({ sqlAliasedBehavior: "alias", sqlBehavior: "sql" })
        )
      );
      const orderByArray = Array.isArray(orderBy) ? orderBy : [orderBy];
      this.config.orderBy = orderByArray;
    } else {
      const orderByArray = columns;
      this.config.orderBy = orderByArray;
    }
    return this;
  }
  limit(limit) {
    this.config.limit = limit;
    return this;
  }
  returning(fields = this.table[SQLiteTable.Symbol.Columns]) {
    this.config.returning = orderSelectedFields(fields);
    return this;
  }
  /** @internal */
  getSQL() {
    return this.dialect.buildDeleteQuery(this.config);
  }
  toSQL() {
    const { typings: _typings, ...rest } = this.dialect.sqlToQuery(this.getSQL());
    return rest;
  }
  /** @internal */
  _prepare(isOneTimeQuery = true) {
    return this.session[isOneTimeQuery ? "prepareOneTimeQuery" : "prepareQuery"](
      this.dialect.sqlToQuery(this.getSQL()),
      this.config.returning,
      this.config.returning ? "all" : "run",
      true,
      void 0,
      {
        type: "delete",
        tables: extractUsedTable(this.config.table)
      }
    );
  }
  prepare() {
    return this._prepare(false);
  }
  run = /* @__PURE__ */ __name((placeholderValues) => {
    return this._prepare().run(placeholderValues);
  }, "run");
  all = /* @__PURE__ */ __name((placeholderValues) => {
    return this._prepare().all(placeholderValues);
  }, "all");
  get = /* @__PURE__ */ __name((placeholderValues) => {
    return this._prepare().get(placeholderValues);
  }, "get");
  values = /* @__PURE__ */ __name((placeholderValues) => {
    return this._prepare().values(placeholderValues);
  }, "values");
  async execute(placeholderValues) {
    return this._prepare().execute(placeholderValues);
  }
  $dynamic() {
    return this;
  }
};

// node_modules/.pnpm/drizzle-orm@0.45.1_@libsql+client@0.17.0_@types+better-sqlite3@7.6.13_better-sqlite3@12.6.2/node_modules/drizzle-orm/casing.js
function toSnakeCase(input) {
  const words = input.replace(/['\u2019]/g, "").match(/[\da-z]+|[A-Z]+(?![a-z])|[A-Z][\da-z]+/g) ?? [];
  return words.map((word) => word.toLowerCase()).join("_");
}
__name(toSnakeCase, "toSnakeCase");
function toCamelCase(input) {
  const words = input.replace(/['\u2019]/g, "").match(/[\da-z]+|[A-Z]+(?![a-z])|[A-Z][\da-z]+/g) ?? [];
  return words.reduce((acc, word, i) => {
    const formattedWord = i === 0 ? word.toLowerCase() : `${word[0].toUpperCase()}${word.slice(1)}`;
    return acc + formattedWord;
  }, "");
}
__name(toCamelCase, "toCamelCase");
function noopCase(input) {
  return input;
}
__name(noopCase, "noopCase");
var CasingCache = class {
  static {
    __name(this, "CasingCache");
  }
  static [entityKind] = "CasingCache";
  /** @internal */
  cache = {};
  cachedTables = {};
  convert;
  constructor(casing) {
    this.convert = casing === "snake_case" ? toSnakeCase : casing === "camelCase" ? toCamelCase : noopCase;
  }
  getColumnCasing(column) {
    if (!column.keyAsName) return column.name;
    const schema = column.table[Table.Symbol.Schema] ?? "public";
    const tableName = column.table[Table.Symbol.OriginalName];
    const key = `${schema}.${tableName}.${column.name}`;
    if (!this.cache[key]) {
      this.cacheTable(column.table);
    }
    return this.cache[key];
  }
  cacheTable(table) {
    const schema = table[Table.Symbol.Schema] ?? "public";
    const tableName = table[Table.Symbol.OriginalName];
    const tableKey = `${schema}.${tableName}`;
    if (!this.cachedTables[tableKey]) {
      for (const column of Object.values(table[Table.Symbol.Columns])) {
        const columnKey = `${tableKey}.${column.name}`;
        this.cache[columnKey] = this.convert(column.name);
      }
      this.cachedTables[tableKey] = true;
    }
  }
  clearCache() {
    this.cache = {};
    this.cachedTables = {};
  }
};

// node_modules/.pnpm/drizzle-orm@0.45.1_@libsql+client@0.17.0_@types+better-sqlite3@7.6.13_better-sqlite3@12.6.2/node_modules/drizzle-orm/errors.js
var DrizzleError = class extends Error {
  static {
    __name(this, "DrizzleError");
  }
  static [entityKind] = "DrizzleError";
  constructor({ message: message2, cause }) {
    super(message2);
    this.name = "DrizzleError";
    this.cause = cause;
  }
};
var DrizzleQueryError = class _DrizzleQueryError extends Error {
  static {
    __name(this, "DrizzleQueryError");
  }
  constructor(query, params, cause) {
    super(`Failed query: ${query}
params: ${params}`);
    this.query = query;
    this.params = params;
    this.cause = cause;
    Error.captureStackTrace(this, _DrizzleQueryError);
    if (cause) this.cause = cause;
  }
};
var TransactionRollbackError = class extends DrizzleError {
  static {
    __name(this, "TransactionRollbackError");
  }
  static [entityKind] = "TransactionRollbackError";
  constructor() {
    super({ message: "Rollback" });
  }
};

// node_modules/.pnpm/drizzle-orm@0.45.1_@libsql+client@0.17.0_@types+better-sqlite3@7.6.13_better-sqlite3@12.6.2/node_modules/drizzle-orm/pg-core/table.js
var InlineForeignKeys2 = Symbol.for("drizzle:PgInlineForeignKeys");
var EnableRLS = Symbol.for("drizzle:EnableRLS");
var PgTable = class extends Table {
  static {
    __name(this, "PgTable");
  }
  static [entityKind] = "PgTable";
  /** @internal */
  static Symbol = Object.assign({}, Table.Symbol, {
    InlineForeignKeys: InlineForeignKeys2,
    EnableRLS
  });
  /**@internal */
  [InlineForeignKeys2] = [];
  /** @internal */
  [EnableRLS] = false;
  /** @internal */
  [Table.Symbol.ExtraConfigBuilder] = void 0;
  /** @internal */
  [Table.Symbol.ExtraConfigColumns] = {};
};

// node_modules/.pnpm/drizzle-orm@0.45.1_@libsql+client@0.17.0_@types+better-sqlite3@7.6.13_better-sqlite3@12.6.2/node_modules/drizzle-orm/pg-core/primary-keys.js
var PrimaryKeyBuilder2 = class {
  static {
    __name(this, "PrimaryKeyBuilder");
  }
  static [entityKind] = "PgPrimaryKeyBuilder";
  /** @internal */
  columns;
  /** @internal */
  name;
  constructor(columns, name) {
    this.columns = columns;
    this.name = name;
  }
  /** @internal */
  build(table) {
    return new PrimaryKey2(table, this.columns, this.name);
  }
};
var PrimaryKey2 = class {
  static {
    __name(this, "PrimaryKey");
  }
  constructor(table, columns, name) {
    this.table = table;
    this.columns = columns;
    this.name = name;
  }
  static [entityKind] = "PgPrimaryKey";
  columns;
  name;
  getName() {
    return this.name ?? `${this.table[PgTable.Symbol.Name]}_${this.columns.map((column) => column.name).join("_")}_pk`;
  }
};

// node_modules/.pnpm/drizzle-orm@0.45.1_@libsql+client@0.17.0_@types+better-sqlite3@7.6.13_better-sqlite3@12.6.2/node_modules/drizzle-orm/sql/expressions/conditions.js
function bindIfParam(value, column) {
  if (isDriverValueEncoder(column) && !isSQLWrapper(value) && !is(value, Param) && !is(value, Placeholder) && !is(value, Column) && !is(value, Table) && !is(value, View)) {
    return new Param(value, column);
  }
  return value;
}
__name(bindIfParam, "bindIfParam");
var eq = /* @__PURE__ */ __name((left, right) => {
  return sql`${left} = ${bindIfParam(right, left)}`;
}, "eq");
var ne = /* @__PURE__ */ __name((left, right) => {
  return sql`${left} <> ${bindIfParam(right, left)}`;
}, "ne");
function and(...unfilteredConditions) {
  const conditions = unfilteredConditions.filter(
    (c) => c !== void 0
  );
  if (conditions.length === 0) {
    return void 0;
  }
  if (conditions.length === 1) {
    return new SQL(conditions);
  }
  return new SQL([
    new StringChunk("("),
    sql.join(conditions, new StringChunk(" and ")),
    new StringChunk(")")
  ]);
}
__name(and, "and");
function or(...unfilteredConditions) {
  const conditions = unfilteredConditions.filter(
    (c) => c !== void 0
  );
  if (conditions.length === 0) {
    return void 0;
  }
  if (conditions.length === 1) {
    return new SQL(conditions);
  }
  return new SQL([
    new StringChunk("("),
    sql.join(conditions, new StringChunk(" or ")),
    new StringChunk(")")
  ]);
}
__name(or, "or");
function not(condition) {
  return sql`not ${condition}`;
}
__name(not, "not");
var gt = /* @__PURE__ */ __name((left, right) => {
  return sql`${left} > ${bindIfParam(right, left)}`;
}, "gt");
var gte = /* @__PURE__ */ __name((left, right) => {
  return sql`${left} >= ${bindIfParam(right, left)}`;
}, "gte");
var lt = /* @__PURE__ */ __name((left, right) => {
  return sql`${left} < ${bindIfParam(right, left)}`;
}, "lt");
var lte = /* @__PURE__ */ __name((left, right) => {
  return sql`${left} <= ${bindIfParam(right, left)}`;
}, "lte");
function inArray(column, values) {
  if (Array.isArray(values)) {
    if (values.length === 0) {
      return sql`false`;
    }
    return sql`${column} in ${values.map((v2) => bindIfParam(v2, column))}`;
  }
  return sql`${column} in ${bindIfParam(values, column)}`;
}
__name(inArray, "inArray");
function notInArray(column, values) {
  if (Array.isArray(values)) {
    if (values.length === 0) {
      return sql`true`;
    }
    return sql`${column} not in ${values.map((v2) => bindIfParam(v2, column))}`;
  }
  return sql`${column} not in ${bindIfParam(values, column)}`;
}
__name(notInArray, "notInArray");
function isNull(value) {
  return sql`${value} is null`;
}
__name(isNull, "isNull");
function isNotNull(value) {
  return sql`${value} is not null`;
}
__name(isNotNull, "isNotNull");
function exists(subquery) {
  return sql`exists ${subquery}`;
}
__name(exists, "exists");
function notExists(subquery) {
  return sql`not exists ${subquery}`;
}
__name(notExists, "notExists");
function between(column, min, max) {
  return sql`${column} between ${bindIfParam(min, column)} and ${bindIfParam(
    max,
    column
  )}`;
}
__name(between, "between");
function notBetween(column, min, max) {
  return sql`${column} not between ${bindIfParam(
    min,
    column
  )} and ${bindIfParam(max, column)}`;
}
__name(notBetween, "notBetween");
function like(column, value) {
  return sql`${column} like ${value}`;
}
__name(like, "like");
function notLike(column, value) {
  return sql`${column} not like ${value}`;
}
__name(notLike, "notLike");
function ilike(column, value) {
  return sql`${column} ilike ${value}`;
}
__name(ilike, "ilike");
function notIlike(column, value) {
  return sql`${column} not ilike ${value}`;
}
__name(notIlike, "notIlike");

// node_modules/.pnpm/drizzle-orm@0.45.1_@libsql+client@0.17.0_@types+better-sqlite3@7.6.13_better-sqlite3@12.6.2/node_modules/drizzle-orm/sql/expressions/select.js
function asc(column) {
  return sql`${column} asc`;
}
__name(asc, "asc");
function desc(column) {
  return sql`${column} desc`;
}
__name(desc, "desc");

// node_modules/.pnpm/drizzle-orm@0.45.1_@libsql+client@0.17.0_@types+better-sqlite3@7.6.13_better-sqlite3@12.6.2/node_modules/drizzle-orm/relations.js
var Relation = class {
  static {
    __name(this, "Relation");
  }
  constructor(sourceTable, referencedTable, relationName) {
    this.sourceTable = sourceTable;
    this.referencedTable = referencedTable;
    this.relationName = relationName;
    this.referencedTableName = referencedTable[Table.Symbol.Name];
  }
  static [entityKind] = "Relation";
  referencedTableName;
  fieldName;
};
var Relations = class {
  static {
    __name(this, "Relations");
  }
  constructor(table, config) {
    this.table = table;
    this.config = config;
  }
  static [entityKind] = "Relations";
};
var One = class _One extends Relation {
  static {
    __name(this, "One");
  }
  constructor(sourceTable, referencedTable, config, isNullable) {
    super(sourceTable, referencedTable, config?.relationName);
    this.config = config;
    this.isNullable = isNullable;
  }
  static [entityKind] = "One";
  withFieldName(fieldName) {
    const relation = new _One(
      this.sourceTable,
      this.referencedTable,
      this.config,
      this.isNullable
    );
    relation.fieldName = fieldName;
    return relation;
  }
};
var Many = class _Many extends Relation {
  static {
    __name(this, "Many");
  }
  constructor(sourceTable, referencedTable, config) {
    super(sourceTable, referencedTable, config?.relationName);
    this.config = config;
  }
  static [entityKind] = "Many";
  withFieldName(fieldName) {
    const relation = new _Many(
      this.sourceTable,
      this.referencedTable,
      this.config
    );
    relation.fieldName = fieldName;
    return relation;
  }
};
function getOperators() {
  return {
    and,
    between,
    eq,
    exists,
    gt,
    gte,
    ilike,
    inArray,
    isNull,
    isNotNull,
    like,
    lt,
    lte,
    ne,
    not,
    notBetween,
    notExists,
    notLike,
    notIlike,
    notInArray,
    or,
    sql
  };
}
__name(getOperators, "getOperators");
function getOrderByOperators() {
  return {
    sql,
    asc,
    desc
  };
}
__name(getOrderByOperators, "getOrderByOperators");
function extractTablesRelationalConfig(schema, configHelpers) {
  if (Object.keys(schema).length === 1 && "default" in schema && !is(schema["default"], Table)) {
    schema = schema["default"];
  }
  const tableNamesMap = {};
  const relationsBuffer = {};
  const tablesConfig = {};
  for (const [key, value] of Object.entries(schema)) {
    if (is(value, Table)) {
      const dbName = getTableUniqueName(value);
      const bufferedRelations = relationsBuffer[dbName];
      tableNamesMap[dbName] = key;
      tablesConfig[key] = {
        tsName: key,
        dbName: value[Table.Symbol.Name],
        schema: value[Table.Symbol.Schema],
        columns: value[Table.Symbol.Columns],
        relations: bufferedRelations?.relations ?? {},
        primaryKey: bufferedRelations?.primaryKey ?? []
      };
      for (const column of Object.values(
        value[Table.Symbol.Columns]
      )) {
        if (column.primary) {
          tablesConfig[key].primaryKey.push(column);
        }
      }
      const extraConfig = value[Table.Symbol.ExtraConfigBuilder]?.(value[Table.Symbol.ExtraConfigColumns]);
      if (extraConfig) {
        for (const configEntry of Object.values(extraConfig)) {
          if (is(configEntry, PrimaryKeyBuilder2)) {
            tablesConfig[key].primaryKey.push(...configEntry.columns);
          }
        }
      }
    } else if (is(value, Relations)) {
      const dbName = getTableUniqueName(value.table);
      const tableName = tableNamesMap[dbName];
      const relations2 = value.config(
        configHelpers(value.table)
      );
      let primaryKey2;
      for (const [relationName, relation] of Object.entries(relations2)) {
        if (tableName) {
          const tableConfig = tablesConfig[tableName];
          tableConfig.relations[relationName] = relation;
          if (primaryKey2) {
            tableConfig.primaryKey.push(...primaryKey2);
          }
        } else {
          if (!(dbName in relationsBuffer)) {
            relationsBuffer[dbName] = {
              relations: {},
              primaryKey: primaryKey2
            };
          }
          relationsBuffer[dbName].relations[relationName] = relation;
        }
      }
    }
  }
  return { tables: tablesConfig, tableNamesMap };
}
__name(extractTablesRelationalConfig, "extractTablesRelationalConfig");
function relations(table, relations2) {
  return new Relations(
    table,
    (helpers) => Object.fromEntries(
      Object.entries(relations2(helpers)).map(([key, value]) => [
        key,
        value.withFieldName(key)
      ])
    )
  );
}
__name(relations, "relations");
function createOne(sourceTable) {
  return /* @__PURE__ */ __name(function one(table, config) {
    return new One(
      sourceTable,
      table,
      config,
      config?.fields.reduce((res, f) => res && f.notNull, true) ?? false
    );
  }, "one");
}
__name(createOne, "createOne");
function createMany(sourceTable) {
  return /* @__PURE__ */ __name(function many(referencedTable, config) {
    return new Many(sourceTable, referencedTable, config);
  }, "many");
}
__name(createMany, "createMany");
function normalizeRelation(schema, tableNamesMap, relation) {
  if (is(relation, One) && relation.config) {
    return {
      fields: relation.config.fields,
      references: relation.config.references
    };
  }
  const referencedTableTsName = tableNamesMap[getTableUniqueName(relation.referencedTable)];
  if (!referencedTableTsName) {
    throw new Error(
      `Table "${relation.referencedTable[Table.Symbol.Name]}" not found in schema`
    );
  }
  const referencedTableConfig = schema[referencedTableTsName];
  if (!referencedTableConfig) {
    throw new Error(`Table "${referencedTableTsName}" not found in schema`);
  }
  const sourceTable = relation.sourceTable;
  const sourceTableTsName = tableNamesMap[getTableUniqueName(sourceTable)];
  if (!sourceTableTsName) {
    throw new Error(
      `Table "${sourceTable[Table.Symbol.Name]}" not found in schema`
    );
  }
  const reverseRelations = [];
  for (const referencedTableRelation of Object.values(
    referencedTableConfig.relations
  )) {
    if (relation.relationName && relation !== referencedTableRelation && referencedTableRelation.relationName === relation.relationName || !relation.relationName && referencedTableRelation.referencedTable === relation.sourceTable) {
      reverseRelations.push(referencedTableRelation);
    }
  }
  if (reverseRelations.length > 1) {
    throw relation.relationName ? new Error(
      `There are multiple relations with name "${relation.relationName}" in table "${referencedTableTsName}"`
    ) : new Error(
      `There are multiple relations between "${referencedTableTsName}" and "${relation.sourceTable[Table.Symbol.Name]}". Please specify relation name`
    );
  }
  if (reverseRelations[0] && is(reverseRelations[0], One) && reverseRelations[0].config) {
    return {
      fields: reverseRelations[0].config.references,
      references: reverseRelations[0].config.fields
    };
  }
  throw new Error(
    `There is not enough information to infer relation "${sourceTableTsName}.${relation.fieldName}"`
  );
}
__name(normalizeRelation, "normalizeRelation");
function createTableRelationsHelpers(sourceTable) {
  return {
    one: createOne(sourceTable),
    many: createMany(sourceTable)
  };
}
__name(createTableRelationsHelpers, "createTableRelationsHelpers");
function mapRelationalRow(tablesConfig, tableConfig, row, buildQueryResultSelection, mapColumnValue = (value) => value) {
  const result = {};
  for (const [
    selectionItemIndex,
    selectionItem
  ] of buildQueryResultSelection.entries()) {
    if (selectionItem.isJson) {
      const relation = tableConfig.relations[selectionItem.tsKey];
      const rawSubRows = row[selectionItemIndex];
      const subRows = typeof rawSubRows === "string" ? JSON.parse(rawSubRows) : rawSubRows;
      result[selectionItem.tsKey] = is(relation, One) ? subRows && mapRelationalRow(
        tablesConfig,
        tablesConfig[selectionItem.relationTableTsKey],
        subRows,
        selectionItem.selection,
        mapColumnValue
      ) : subRows.map(
        (subRow) => mapRelationalRow(
          tablesConfig,
          tablesConfig[selectionItem.relationTableTsKey],
          subRow,
          selectionItem.selection,
          mapColumnValue
        )
      );
    } else {
      const value = mapColumnValue(row[selectionItemIndex]);
      const field = selectionItem.field;
      let decoder2;
      if (is(field, Column)) {
        decoder2 = field;
      } else if (is(field, SQL)) {
        decoder2 = field.decoder;
      } else {
        decoder2 = field.sql.decoder;
      }
      result[selectionItem.tsKey] = value === null ? null : decoder2.mapFromDriverValue(value);
    }
  }
  return result;
}
__name(mapRelationalRow, "mapRelationalRow");

// node_modules/.pnpm/drizzle-orm@0.45.1_@libsql+client@0.17.0_@types+better-sqlite3@7.6.13_better-sqlite3@12.6.2/node_modules/drizzle-orm/sqlite-core/view-base.js
var SQLiteViewBase = class extends View {
  static {
    __name(this, "SQLiteViewBase");
  }
  static [entityKind] = "SQLiteViewBase";
};

// node_modules/.pnpm/drizzle-orm@0.45.1_@libsql+client@0.17.0_@types+better-sqlite3@7.6.13_better-sqlite3@12.6.2/node_modules/drizzle-orm/sqlite-core/dialect.js
var SQLiteDialect = class {
  static {
    __name(this, "SQLiteDialect");
  }
  static [entityKind] = "SQLiteDialect";
  /** @internal */
  casing;
  constructor(config) {
    this.casing = new CasingCache(config?.casing);
  }
  escapeName(name) {
    return `"${name}"`;
  }
  escapeParam(_num) {
    return "?";
  }
  escapeString(str) {
    return `'${str.replace(/'/g, "''")}'`;
  }
  buildWithCTE(queries) {
    if (!queries?.length) return void 0;
    const withSqlChunks = [sql`with `];
    for (const [i, w2] of queries.entries()) {
      withSqlChunks.push(sql`${sql.identifier(w2._.alias)} as (${w2._.sql})`);
      if (i < queries.length - 1) {
        withSqlChunks.push(sql`, `);
      }
    }
    withSqlChunks.push(sql` `);
    return sql.join(withSqlChunks);
  }
  buildDeleteQuery({ table, where, returning, withList, limit, orderBy }) {
    const withSql = this.buildWithCTE(withList);
    const returningSql = returning ? sql` returning ${this.buildSelection(returning, { isSingleTable: true })}` : void 0;
    const whereSql = where ? sql` where ${where}` : void 0;
    const orderBySql = this.buildOrderBy(orderBy);
    const limitSql = this.buildLimit(limit);
    return sql`${withSql}delete from ${table}${whereSql}${returningSql}${orderBySql}${limitSql}`;
  }
  buildUpdateSet(table, set) {
    const tableColumns = table[Table.Symbol.Columns];
    const columnNames = Object.keys(tableColumns).filter(
      (colName) => set[colName] !== void 0 || tableColumns[colName]?.onUpdateFn !== void 0
    );
    const setSize = columnNames.length;
    return sql.join(columnNames.flatMap((colName, i) => {
      const col = tableColumns[colName];
      const onUpdateFnResult = col.onUpdateFn?.();
      const value = set[colName] ?? (is(onUpdateFnResult, SQL) ? onUpdateFnResult : sql.param(onUpdateFnResult, col));
      const res = sql`${sql.identifier(this.casing.getColumnCasing(col))} = ${value}`;
      if (i < setSize - 1) {
        return [res, sql.raw(", ")];
      }
      return [res];
    }));
  }
  buildUpdateQuery({ table, set, where, returning, withList, joins, from, limit, orderBy }) {
    const withSql = this.buildWithCTE(withList);
    const setSql = this.buildUpdateSet(table, set);
    const fromSql = from && sql.join([sql.raw(" from "), this.buildFromTable(from)]);
    const joinsSql = this.buildJoins(joins);
    const returningSql = returning ? sql` returning ${this.buildSelection(returning, { isSingleTable: true })}` : void 0;
    const whereSql = where ? sql` where ${where}` : void 0;
    const orderBySql = this.buildOrderBy(orderBy);
    const limitSql = this.buildLimit(limit);
    return sql`${withSql}update ${table} set ${setSql}${fromSql}${joinsSql}${whereSql}${returningSql}${orderBySql}${limitSql}`;
  }
  /**
   * Builds selection SQL with provided fields/expressions
   *
   * Examples:
   *
   * `select <selection> from`
   *
   * `insert ... returning <selection>`
   *
   * If `isSingleTable` is true, then columns won't be prefixed with table name
   */
  buildSelection(fields, { isSingleTable = false } = {}) {
    const columnsLen = fields.length;
    const chunks = fields.flatMap(({ field }, i) => {
      const chunk = [];
      if (is(field, SQL.Aliased) && field.isSelectionField) {
        chunk.push(sql.identifier(field.fieldAlias));
      } else if (is(field, SQL.Aliased) || is(field, SQL)) {
        const query = is(field, SQL.Aliased) ? field.sql : field;
        if (isSingleTable) {
          chunk.push(
            new SQL(
              query.queryChunks.map((c) => {
                if (is(c, Column)) {
                  return sql.identifier(this.casing.getColumnCasing(c));
                }
                return c;
              })
            )
          );
        } else {
          chunk.push(query);
        }
        if (is(field, SQL.Aliased)) {
          chunk.push(sql` as ${sql.identifier(field.fieldAlias)}`);
        }
      } else if (is(field, Column)) {
        const tableName = field.table[Table.Symbol.Name];
        if (field.columnType === "SQLiteNumericBigInt") {
          if (isSingleTable) {
            chunk.push(sql`cast(${sql.identifier(this.casing.getColumnCasing(field))} as text)`);
          } else {
            chunk.push(
              sql`cast(${sql.identifier(tableName)}.${sql.identifier(this.casing.getColumnCasing(field))} as text)`
            );
          }
        } else {
          if (isSingleTable) {
            chunk.push(sql.identifier(this.casing.getColumnCasing(field)));
          } else {
            chunk.push(sql`${sql.identifier(tableName)}.${sql.identifier(this.casing.getColumnCasing(field))}`);
          }
        }
      } else if (is(field, Subquery)) {
        const entries = Object.entries(field._.selectedFields);
        if (entries.length === 1) {
          const entry = entries[0][1];
          const fieldDecoder = is(entry, SQL) ? entry.decoder : is(entry, Column) ? { mapFromDriverValue: /* @__PURE__ */ __name((v2) => entry.mapFromDriverValue(v2), "mapFromDriverValue") } : entry.sql.decoder;
          if (fieldDecoder) field._.sql.decoder = fieldDecoder;
        }
        chunk.push(field);
      }
      if (i < columnsLen - 1) {
        chunk.push(sql`, `);
      }
      return chunk;
    });
    return sql.join(chunks);
  }
  buildJoins(joins) {
    if (!joins || joins.length === 0) {
      return void 0;
    }
    const joinsArray = [];
    if (joins) {
      for (const [index2, joinMeta] of joins.entries()) {
        if (index2 === 0) {
          joinsArray.push(sql` `);
        }
        const table = joinMeta.table;
        const onSql = joinMeta.on ? sql` on ${joinMeta.on}` : void 0;
        if (is(table, SQLiteTable)) {
          const tableName = table[SQLiteTable.Symbol.Name];
          const tableSchema = table[SQLiteTable.Symbol.Schema];
          const origTableName = table[SQLiteTable.Symbol.OriginalName];
          const alias = tableName === origTableName ? void 0 : joinMeta.alias;
          joinsArray.push(
            sql`${sql.raw(joinMeta.joinType)} join ${tableSchema ? sql`${sql.identifier(tableSchema)}.` : void 0}${sql.identifier(origTableName)}${alias && sql` ${sql.identifier(alias)}`}${onSql}`
          );
        } else {
          joinsArray.push(
            sql`${sql.raw(joinMeta.joinType)} join ${table}${onSql}`
          );
        }
        if (index2 < joins.length - 1) {
          joinsArray.push(sql` `);
        }
      }
    }
    return sql.join(joinsArray);
  }
  buildLimit(limit) {
    return typeof limit === "object" || typeof limit === "number" && limit >= 0 ? sql` limit ${limit}` : void 0;
  }
  buildOrderBy(orderBy) {
    const orderByList = [];
    if (orderBy) {
      for (const [index2, orderByValue] of orderBy.entries()) {
        orderByList.push(orderByValue);
        if (index2 < orderBy.length - 1) {
          orderByList.push(sql`, `);
        }
      }
    }
    return orderByList.length > 0 ? sql` order by ${sql.join(orderByList)}` : void 0;
  }
  buildFromTable(table) {
    if (is(table, Table) && table[Table.Symbol.IsAlias]) {
      return sql`${sql`${sql.identifier(table[Table.Symbol.Schema] ?? "")}.`.if(table[Table.Symbol.Schema])}${sql.identifier(table[Table.Symbol.OriginalName])} ${sql.identifier(table[Table.Symbol.Name])}`;
    }
    return table;
  }
  buildSelectQuery({
    withList,
    fields,
    fieldsFlat,
    where,
    having,
    table,
    joins,
    orderBy,
    groupBy,
    limit,
    offset,
    distinct,
    setOperators
  }) {
    const fieldsList = fieldsFlat ?? orderSelectedFields(fields);
    for (const f of fieldsList) {
      if (is(f.field, Column) && getTableName(f.field.table) !== (is(table, Subquery) ? table._.alias : is(table, SQLiteViewBase) ? table[ViewBaseConfig].name : is(table, SQL) ? void 0 : getTableName(table)) && !((table2) => joins?.some(
        ({ alias }) => alias === (table2[Table.Symbol.IsAlias] ? getTableName(table2) : table2[Table.Symbol.BaseName])
      ))(f.field.table)) {
        const tableName = getTableName(f.field.table);
        throw new Error(
          `Your "${f.path.join("->")}" field references a column "${tableName}"."${f.field.name}", but the table "${tableName}" is not part of the query! Did you forget to join it?`
        );
      }
    }
    const isSingleTable = !joins || joins.length === 0;
    const withSql = this.buildWithCTE(withList);
    const distinctSql = distinct ? sql` distinct` : void 0;
    const selection = this.buildSelection(fieldsList, { isSingleTable });
    const tableSql = this.buildFromTable(table);
    const joinsSql = this.buildJoins(joins);
    const whereSql = where ? sql` where ${where}` : void 0;
    const havingSql = having ? sql` having ${having}` : void 0;
    const groupByList = [];
    if (groupBy) {
      for (const [index2, groupByValue] of groupBy.entries()) {
        groupByList.push(groupByValue);
        if (index2 < groupBy.length - 1) {
          groupByList.push(sql`, `);
        }
      }
    }
    const groupBySql = groupByList.length > 0 ? sql` group by ${sql.join(groupByList)}` : void 0;
    const orderBySql = this.buildOrderBy(orderBy);
    const limitSql = this.buildLimit(limit);
    const offsetSql = offset ? sql` offset ${offset}` : void 0;
    const finalQuery = sql`${withSql}select${distinctSql} ${selection} from ${tableSql}${joinsSql}${whereSql}${groupBySql}${havingSql}${orderBySql}${limitSql}${offsetSql}`;
    if (setOperators.length > 0) {
      return this.buildSetOperations(finalQuery, setOperators);
    }
    return finalQuery;
  }
  buildSetOperations(leftSelect, setOperators) {
    const [setOperator, ...rest] = setOperators;
    if (!setOperator) {
      throw new Error("Cannot pass undefined values to any set operator");
    }
    if (rest.length === 0) {
      return this.buildSetOperationQuery({ leftSelect, setOperator });
    }
    return this.buildSetOperations(
      this.buildSetOperationQuery({ leftSelect, setOperator }),
      rest
    );
  }
  buildSetOperationQuery({
    leftSelect,
    setOperator: { type, isAll, rightSelect, limit, orderBy, offset }
  }) {
    const leftChunk = sql`${leftSelect.getSQL()} `;
    const rightChunk = sql`${rightSelect.getSQL()}`;
    let orderBySql;
    if (orderBy && orderBy.length > 0) {
      const orderByValues = [];
      for (const singleOrderBy of orderBy) {
        if (is(singleOrderBy, SQLiteColumn)) {
          orderByValues.push(sql.identifier(singleOrderBy.name));
        } else if (is(singleOrderBy, SQL)) {
          for (let i = 0; i < singleOrderBy.queryChunks.length; i++) {
            const chunk = singleOrderBy.queryChunks[i];
            if (is(chunk, SQLiteColumn)) {
              singleOrderBy.queryChunks[i] = sql.identifier(this.casing.getColumnCasing(chunk));
            }
          }
          orderByValues.push(sql`${singleOrderBy}`);
        } else {
          orderByValues.push(sql`${singleOrderBy}`);
        }
      }
      orderBySql = sql` order by ${sql.join(orderByValues, sql`, `)}`;
    }
    const limitSql = typeof limit === "object" || typeof limit === "number" && limit >= 0 ? sql` limit ${limit}` : void 0;
    const operatorChunk = sql.raw(`${type} ${isAll ? "all " : ""}`);
    const offsetSql = offset ? sql` offset ${offset}` : void 0;
    return sql`${leftChunk}${operatorChunk}${rightChunk}${orderBySql}${limitSql}${offsetSql}`;
  }
  buildInsertQuery({ table, values: valuesOrSelect, onConflict, returning, withList, select }) {
    const valuesSqlList = [];
    const columns = table[Table.Symbol.Columns];
    const colEntries = Object.entries(columns).filter(
      ([_2, col]) => !col.shouldDisableInsert()
    );
    const insertOrder = colEntries.map(([, column]) => sql.identifier(this.casing.getColumnCasing(column)));
    if (select) {
      const select2 = valuesOrSelect;
      if (is(select2, SQL)) {
        valuesSqlList.push(select2);
      } else {
        valuesSqlList.push(select2.getSQL());
      }
    } else {
      const values = valuesOrSelect;
      valuesSqlList.push(sql.raw("values "));
      for (const [valueIndex, value] of values.entries()) {
        const valueList = [];
        for (const [fieldName, col] of colEntries) {
          const colValue = value[fieldName];
          if (colValue === void 0 || is(colValue, Param) && colValue.value === void 0) {
            let defaultValue;
            if (col.default !== null && col.default !== void 0) {
              defaultValue = is(col.default, SQL) ? col.default : sql.param(col.default, col);
            } else if (col.defaultFn !== void 0) {
              const defaultFnResult = col.defaultFn();
              defaultValue = is(defaultFnResult, SQL) ? defaultFnResult : sql.param(defaultFnResult, col);
            } else if (!col.default && col.onUpdateFn !== void 0) {
              const onUpdateFnResult = col.onUpdateFn();
              defaultValue = is(onUpdateFnResult, SQL) ? onUpdateFnResult : sql.param(onUpdateFnResult, col);
            } else {
              defaultValue = sql`null`;
            }
            valueList.push(defaultValue);
          } else {
            valueList.push(colValue);
          }
        }
        valuesSqlList.push(valueList);
        if (valueIndex < values.length - 1) {
          valuesSqlList.push(sql`, `);
        }
      }
    }
    const withSql = this.buildWithCTE(withList);
    const valuesSql = sql.join(valuesSqlList);
    const returningSql = returning ? sql` returning ${this.buildSelection(returning, { isSingleTable: true })}` : void 0;
    const onConflictSql = onConflict?.length ? sql.join(onConflict) : void 0;
    return sql`${withSql}insert into ${table} ${insertOrder} ${valuesSql}${onConflictSql}${returningSql}`;
  }
  sqlToQuery(sql2, invokeSource) {
    return sql2.toQuery({
      casing: this.casing,
      escapeName: this.escapeName,
      escapeParam: this.escapeParam,
      escapeString: this.escapeString,
      invokeSource
    });
  }
  buildRelationalQuery({
    fullSchema,
    schema,
    tableNamesMap,
    table,
    tableConfig,
    queryConfig: config,
    tableAlias,
    nestedQueryRelation,
    joinOn
  }) {
    let selection = [];
    let limit, offset, orderBy = [], where;
    const joins = [];
    if (config === true) {
      const selectionEntries = Object.entries(tableConfig.columns);
      selection = selectionEntries.map(([key, value]) => ({
        dbKey: value.name,
        tsKey: key,
        field: aliasedTableColumn(value, tableAlias),
        relationTableTsKey: void 0,
        isJson: false,
        selection: []
      }));
    } else {
      const aliasedColumns = Object.fromEntries(
        Object.entries(tableConfig.columns).map(([key, value]) => [key, aliasedTableColumn(value, tableAlias)])
      );
      if (config.where) {
        const whereSql = typeof config.where === "function" ? config.where(aliasedColumns, getOperators()) : config.where;
        where = whereSql && mapColumnsInSQLToAlias(whereSql, tableAlias);
      }
      const fieldsSelection = [];
      let selectedColumns = [];
      if (config.columns) {
        let isIncludeMode = false;
        for (const [field, value] of Object.entries(config.columns)) {
          if (value === void 0) {
            continue;
          }
          if (field in tableConfig.columns) {
            if (!isIncludeMode && value === true) {
              isIncludeMode = true;
            }
            selectedColumns.push(field);
          }
        }
        if (selectedColumns.length > 0) {
          selectedColumns = isIncludeMode ? selectedColumns.filter((c) => config.columns?.[c] === true) : Object.keys(tableConfig.columns).filter((key) => !selectedColumns.includes(key));
        }
      } else {
        selectedColumns = Object.keys(tableConfig.columns);
      }
      for (const field of selectedColumns) {
        const column = tableConfig.columns[field];
        fieldsSelection.push({ tsKey: field, value: column });
      }
      let selectedRelations = [];
      if (config.with) {
        selectedRelations = Object.entries(config.with).filter((entry) => !!entry[1]).map(([tsKey, queryConfig]) => ({ tsKey, queryConfig, relation: tableConfig.relations[tsKey] }));
      }
      let extras;
      if (config.extras) {
        extras = typeof config.extras === "function" ? config.extras(aliasedColumns, { sql }) : config.extras;
        for (const [tsKey, value] of Object.entries(extras)) {
          fieldsSelection.push({
            tsKey,
            value: mapColumnsInAliasedSQLToAlias(value, tableAlias)
          });
        }
      }
      for (const { tsKey, value } of fieldsSelection) {
        selection.push({
          dbKey: is(value, SQL.Aliased) ? value.fieldAlias : tableConfig.columns[tsKey].name,
          tsKey,
          field: is(value, Column) ? aliasedTableColumn(value, tableAlias) : value,
          relationTableTsKey: void 0,
          isJson: false,
          selection: []
        });
      }
      let orderByOrig = typeof config.orderBy === "function" ? config.orderBy(aliasedColumns, getOrderByOperators()) : config.orderBy ?? [];
      if (!Array.isArray(orderByOrig)) {
        orderByOrig = [orderByOrig];
      }
      orderBy = orderByOrig.map((orderByValue) => {
        if (is(orderByValue, Column)) {
          return aliasedTableColumn(orderByValue, tableAlias);
        }
        return mapColumnsInSQLToAlias(orderByValue, tableAlias);
      });
      limit = config.limit;
      offset = config.offset;
      for (const {
        tsKey: selectedRelationTsKey,
        queryConfig: selectedRelationConfigValue,
        relation
      } of selectedRelations) {
        const normalizedRelation = normalizeRelation(schema, tableNamesMap, relation);
        const relationTableName = getTableUniqueName(relation.referencedTable);
        const relationTableTsName = tableNamesMap[relationTableName];
        const relationTableAlias = `${tableAlias}_${selectedRelationTsKey}`;
        const joinOn2 = and(
          ...normalizedRelation.fields.map(
            (field2, i) => eq(
              aliasedTableColumn(normalizedRelation.references[i], relationTableAlias),
              aliasedTableColumn(field2, tableAlias)
            )
          )
        );
        const builtRelation = this.buildRelationalQuery({
          fullSchema,
          schema,
          tableNamesMap,
          table: fullSchema[relationTableTsName],
          tableConfig: schema[relationTableTsName],
          queryConfig: is(relation, One) ? selectedRelationConfigValue === true ? { limit: 1 } : { ...selectedRelationConfigValue, limit: 1 } : selectedRelationConfigValue,
          tableAlias: relationTableAlias,
          joinOn: joinOn2,
          nestedQueryRelation: relation
        });
        const field = sql`(${builtRelation.sql})`.as(selectedRelationTsKey);
        selection.push({
          dbKey: selectedRelationTsKey,
          tsKey: selectedRelationTsKey,
          field,
          relationTableTsKey: relationTableTsName,
          isJson: true,
          selection: builtRelation.selection
        });
      }
    }
    if (selection.length === 0) {
      throw new DrizzleError({
        message: `No fields selected for table "${tableConfig.tsName}" ("${tableAlias}"). You need to have at least one item in "columns", "with" or "extras". If you need to select all columns, omit the "columns" key or set it to undefined.`
      });
    }
    let result;
    where = and(joinOn, where);
    if (nestedQueryRelation) {
      let field = sql`json_array(${sql.join(
        selection.map(
          ({ field: field2 }) => is(field2, SQLiteColumn) ? sql.identifier(this.casing.getColumnCasing(field2)) : is(field2, SQL.Aliased) ? field2.sql : field2
        ),
        sql`, `
      )})`;
      if (is(nestedQueryRelation, Many)) {
        field = sql`coalesce(json_group_array(${field}), json_array())`;
      }
      const nestedSelection = [{
        dbKey: "data",
        tsKey: "data",
        field: field.as("data"),
        isJson: true,
        relationTableTsKey: tableConfig.tsName,
        selection
      }];
      const needsSubquery = limit !== void 0 || offset !== void 0 || orderBy.length > 0;
      if (needsSubquery) {
        result = this.buildSelectQuery({
          table: aliasedTable(table, tableAlias),
          fields: {},
          fieldsFlat: [
            {
              path: [],
              field: sql.raw("*")
            }
          ],
          where,
          limit,
          offset,
          orderBy,
          setOperators: []
        });
        where = void 0;
        limit = void 0;
        offset = void 0;
        orderBy = void 0;
      } else {
        result = aliasedTable(table, tableAlias);
      }
      result = this.buildSelectQuery({
        table: is(result, SQLiteTable) ? result : new Subquery(result, {}, tableAlias),
        fields: {},
        fieldsFlat: nestedSelection.map(({ field: field2 }) => ({
          path: [],
          field: is(field2, Column) ? aliasedTableColumn(field2, tableAlias) : field2
        })),
        joins,
        where,
        limit,
        offset,
        orderBy,
        setOperators: []
      });
    } else {
      result = this.buildSelectQuery({
        table: aliasedTable(table, tableAlias),
        fields: {},
        fieldsFlat: selection.map(({ field }) => ({
          path: [],
          field: is(field, Column) ? aliasedTableColumn(field, tableAlias) : field
        })),
        joins,
        where,
        limit,
        offset,
        orderBy,
        setOperators: []
      });
    }
    return {
      tableTsKey: tableConfig.tsName,
      sql: result,
      selection
    };
  }
};
var SQLiteSyncDialect = class extends SQLiteDialect {
  static {
    __name(this, "SQLiteSyncDialect");
  }
  static [entityKind] = "SQLiteSyncDialect";
  migrate(migrations, session, config) {
    const migrationsTable = config === void 0 ? "__drizzle_migrations" : typeof config === "string" ? "__drizzle_migrations" : config.migrationsTable ?? "__drizzle_migrations";
    const migrationTableCreate = sql`
			CREATE TABLE IF NOT EXISTS ${sql.identifier(migrationsTable)} (
				id SERIAL PRIMARY KEY,
				hash text NOT NULL,
				created_at numeric
			)
		`;
    session.run(migrationTableCreate);
    const dbMigrations = session.values(
      sql`SELECT id, hash, created_at FROM ${sql.identifier(migrationsTable)} ORDER BY created_at DESC LIMIT 1`
    );
    const lastDbMigration = dbMigrations[0] ?? void 0;
    session.run(sql`BEGIN`);
    try {
      for (const migration of migrations) {
        if (!lastDbMigration || Number(lastDbMigration[2]) < migration.folderMillis) {
          for (const stmt of migration.sql) {
            session.run(sql.raw(stmt));
          }
          session.run(
            sql`INSERT INTO ${sql.identifier(migrationsTable)} ("hash", "created_at") VALUES(${migration.hash}, ${migration.folderMillis})`
          );
        }
      }
      session.run(sql`COMMIT`);
    } catch (e) {
      session.run(sql`ROLLBACK`);
      throw e;
    }
  }
};
var SQLiteAsyncDialect = class extends SQLiteDialect {
  static {
    __name(this, "SQLiteAsyncDialect");
  }
  static [entityKind] = "SQLiteAsyncDialect";
  async migrate(migrations, session, config) {
    const migrationsTable = config === void 0 ? "__drizzle_migrations" : typeof config === "string" ? "__drizzle_migrations" : config.migrationsTable ?? "__drizzle_migrations";
    const migrationTableCreate = sql`
			CREATE TABLE IF NOT EXISTS ${sql.identifier(migrationsTable)} (
				id SERIAL PRIMARY KEY,
				hash text NOT NULL,
				created_at numeric
			)
		`;
    await session.run(migrationTableCreate);
    const dbMigrations = await session.values(
      sql`SELECT id, hash, created_at FROM ${sql.identifier(migrationsTable)} ORDER BY created_at DESC LIMIT 1`
    );
    const lastDbMigration = dbMigrations[0] ?? void 0;
    await session.transaction(async (tx) => {
      for (const migration of migrations) {
        if (!lastDbMigration || Number(lastDbMigration[2]) < migration.folderMillis) {
          for (const stmt of migration.sql) {
            await tx.run(sql.raw(stmt));
          }
          await tx.run(
            sql`INSERT INTO ${sql.identifier(migrationsTable)} ("hash", "created_at") VALUES(${migration.hash}, ${migration.folderMillis})`
          );
        }
      }
    });
  }
};

// node_modules/.pnpm/drizzle-orm@0.45.1_@libsql+client@0.17.0_@types+better-sqlite3@7.6.13_better-sqlite3@12.6.2/node_modules/drizzle-orm/query-builders/query-builder.js
var TypedQueryBuilder = class {
  static {
    __name(this, "TypedQueryBuilder");
  }
  static [entityKind] = "TypedQueryBuilder";
  /** @internal */
  getSelectedFields() {
    return this._.selectedFields;
  }
};

// node_modules/.pnpm/drizzle-orm@0.45.1_@libsql+client@0.17.0_@types+better-sqlite3@7.6.13_better-sqlite3@12.6.2/node_modules/drizzle-orm/sqlite-core/query-builders/select.js
var SQLiteSelectBuilder = class {
  static {
    __name(this, "SQLiteSelectBuilder");
  }
  static [entityKind] = "SQLiteSelectBuilder";
  fields;
  session;
  dialect;
  withList;
  distinct;
  constructor(config) {
    this.fields = config.fields;
    this.session = config.session;
    this.dialect = config.dialect;
    this.withList = config.withList;
    this.distinct = config.distinct;
  }
  from(source) {
    const isPartialSelect = !!this.fields;
    let fields;
    if (this.fields) {
      fields = this.fields;
    } else if (is(source, Subquery)) {
      fields = Object.fromEntries(
        Object.keys(source._.selectedFields).map((key) => [key, source[key]])
      );
    } else if (is(source, SQLiteViewBase)) {
      fields = source[ViewBaseConfig].selectedFields;
    } else if (is(source, SQL)) {
      fields = {};
    } else {
      fields = getTableColumns(source);
    }
    return new SQLiteSelectBase({
      table: source,
      fields,
      isPartialSelect,
      session: this.session,
      dialect: this.dialect,
      withList: this.withList,
      distinct: this.distinct
    });
  }
};
var SQLiteSelectQueryBuilderBase = class extends TypedQueryBuilder {
  static {
    __name(this, "SQLiteSelectQueryBuilderBase");
  }
  static [entityKind] = "SQLiteSelectQueryBuilder";
  _;
  /** @internal */
  config;
  joinsNotNullableMap;
  tableName;
  isPartialSelect;
  session;
  dialect;
  cacheConfig = void 0;
  usedTables = /* @__PURE__ */ new Set();
  constructor({ table, fields, isPartialSelect, session, dialect, withList, distinct }) {
    super();
    this.config = {
      withList,
      table,
      fields: { ...fields },
      distinct,
      setOperators: []
    };
    this.isPartialSelect = isPartialSelect;
    this.session = session;
    this.dialect = dialect;
    this._ = {
      selectedFields: fields,
      config: this.config
    };
    this.tableName = getTableLikeName(table);
    this.joinsNotNullableMap = typeof this.tableName === "string" ? { [this.tableName]: true } : {};
    for (const item of extractUsedTable(table)) this.usedTables.add(item);
  }
  /** @internal */
  getUsedTables() {
    return [...this.usedTables];
  }
  createJoin(joinType) {
    return (table, on) => {
      const baseTableName = this.tableName;
      const tableName = getTableLikeName(table);
      for (const item of extractUsedTable(table)) this.usedTables.add(item);
      if (typeof tableName === "string" && this.config.joins?.some((join) => join.alias === tableName)) {
        throw new Error(`Alias "${tableName}" is already used in this query`);
      }
      if (!this.isPartialSelect) {
        if (Object.keys(this.joinsNotNullableMap).length === 1 && typeof baseTableName === "string") {
          this.config.fields = {
            [baseTableName]: this.config.fields
          };
        }
        if (typeof tableName === "string" && !is(table, SQL)) {
          const selection = is(table, Subquery) ? table._.selectedFields : is(table, View) ? table[ViewBaseConfig].selectedFields : table[Table.Symbol.Columns];
          this.config.fields[tableName] = selection;
        }
      }
      if (typeof on === "function") {
        on = on(
          new Proxy(
            this.config.fields,
            new SelectionProxyHandler({ sqlAliasedBehavior: "sql", sqlBehavior: "sql" })
          )
        );
      }
      if (!this.config.joins) {
        this.config.joins = [];
      }
      this.config.joins.push({ on, table, joinType, alias: tableName });
      if (typeof tableName === "string") {
        switch (joinType) {
          case "left": {
            this.joinsNotNullableMap[tableName] = false;
            break;
          }
          case "right": {
            this.joinsNotNullableMap = Object.fromEntries(
              Object.entries(this.joinsNotNullableMap).map(([key]) => [key, false])
            );
            this.joinsNotNullableMap[tableName] = true;
            break;
          }
          case "cross":
          case "inner": {
            this.joinsNotNullableMap[tableName] = true;
            break;
          }
          case "full": {
            this.joinsNotNullableMap = Object.fromEntries(
              Object.entries(this.joinsNotNullableMap).map(([key]) => [key, false])
            );
            this.joinsNotNullableMap[tableName] = false;
            break;
          }
        }
      }
      return this;
    };
  }
  /**
   * Executes a `left join` operation by adding another table to the current query.
   *
   * Calling this method associates each row of the table with the corresponding row from the joined table, if a match is found. If no matching row exists, it sets all columns of the joined table to null.
   *
   * See docs: {@link https://orm.drizzle.team/docs/joins#left-join}
   *
   * @param table the table to join.
   * @param on the `on` clause.
   *
   * @example
   *
   * ```ts
   * // Select all users and their pets
   * const usersWithPets: { user: User; pets: Pet | null; }[] = await db.select()
   *   .from(users)
   *   .leftJoin(pets, eq(users.id, pets.ownerId))
   *
   * // Select userId and petId
   * const usersIdsAndPetIds: { userId: number; petId: number | null; }[] = await db.select({
   *   userId: users.id,
   *   petId: pets.id,
   * })
   *   .from(users)
   *   .leftJoin(pets, eq(users.id, pets.ownerId))
   * ```
   */
  leftJoin = this.createJoin("left");
  /**
   * Executes a `right join` operation by adding another table to the current query.
   *
   * Calling this method associates each row of the joined table with the corresponding row from the main table, if a match is found. If no matching row exists, it sets all columns of the main table to null.
   *
   * See docs: {@link https://orm.drizzle.team/docs/joins#right-join}
   *
   * @param table the table to join.
   * @param on the `on` clause.
   *
   * @example
   *
   * ```ts
   * // Select all users and their pets
   * const usersWithPets: { user: User | null; pets: Pet; }[] = await db.select()
   *   .from(users)
   *   .rightJoin(pets, eq(users.id, pets.ownerId))
   *
   * // Select userId and petId
   * const usersIdsAndPetIds: { userId: number | null; petId: number; }[] = await db.select({
   *   userId: users.id,
   *   petId: pets.id,
   * })
   *   .from(users)
   *   .rightJoin(pets, eq(users.id, pets.ownerId))
   * ```
   */
  rightJoin = this.createJoin("right");
  /**
   * Executes an `inner join` operation, creating a new table by combining rows from two tables that have matching values.
   *
   * Calling this method retrieves rows that have corresponding entries in both joined tables. Rows without matching entries in either table are excluded, resulting in a table that includes only matching pairs.
   *
   * See docs: {@link https://orm.drizzle.team/docs/joins#inner-join}
   *
   * @param table the table to join.
   * @param on the `on` clause.
   *
   * @example
   *
   * ```ts
   * // Select all users and their pets
   * const usersWithPets: { user: User; pets: Pet; }[] = await db.select()
   *   .from(users)
   *   .innerJoin(pets, eq(users.id, pets.ownerId))
   *
   * // Select userId and petId
   * const usersIdsAndPetIds: { userId: number; petId: number; }[] = await db.select({
   *   userId: users.id,
   *   petId: pets.id,
   * })
   *   .from(users)
   *   .innerJoin(pets, eq(users.id, pets.ownerId))
   * ```
   */
  innerJoin = this.createJoin("inner");
  /**
   * Executes a `full join` operation by combining rows from two tables into a new table.
   *
   * Calling this method retrieves all rows from both main and joined tables, merging rows with matching values and filling in `null` for non-matching columns.
   *
   * See docs: {@link https://orm.drizzle.team/docs/joins#full-join}
   *
   * @param table the table to join.
   * @param on the `on` clause.
   *
   * @example
   *
   * ```ts
   * // Select all users and their pets
   * const usersWithPets: { user: User | null; pets: Pet | null; }[] = await db.select()
   *   .from(users)
   *   .fullJoin(pets, eq(users.id, pets.ownerId))
   *
   * // Select userId and petId
   * const usersIdsAndPetIds: { userId: number | null; petId: number | null; }[] = await db.select({
   *   userId: users.id,
   *   petId: pets.id,
   * })
   *   .from(users)
   *   .fullJoin(pets, eq(users.id, pets.ownerId))
   * ```
   */
  fullJoin = this.createJoin("full");
  /**
   * Executes a `cross join` operation by combining rows from two tables into a new table.
   *
   * Calling this method retrieves all rows from both main and joined tables, merging all rows from each table.
   *
   * See docs: {@link https://orm.drizzle.team/docs/joins#cross-join}
   *
   * @param table the table to join.
   *
   * @example
   *
   * ```ts
   * // Select all users, each user with every pet
   * const usersWithPets: { user: User; pets: Pet; }[] = await db.select()
   *   .from(users)
   *   .crossJoin(pets)
   *
   * // Select userId and petId
   * const usersIdsAndPetIds: { userId: number; petId: number; }[] = await db.select({
   *   userId: users.id,
   *   petId: pets.id,
   * })
   *   .from(users)
   *   .crossJoin(pets)
   * ```
   */
  crossJoin = this.createJoin("cross");
  createSetOperator(type, isAll) {
    return (rightSelection) => {
      const rightSelect = typeof rightSelection === "function" ? rightSelection(getSQLiteSetOperators()) : rightSelection;
      if (!haveSameKeys(this.getSelectedFields(), rightSelect.getSelectedFields())) {
        throw new Error(
          "Set operator error (union / intersect / except): selected fields are not the same or are in a different order"
        );
      }
      this.config.setOperators.push({ type, isAll, rightSelect });
      return this;
    };
  }
  /**
   * Adds `union` set operator to the query.
   *
   * Calling this method will combine the result sets of the `select` statements and remove any duplicate rows that appear across them.
   *
   * See docs: {@link https://orm.drizzle.team/docs/set-operations#union}
   *
   * @example
   *
   * ```ts
   * // Select all unique names from customers and users tables
   * await db.select({ name: users.name })
   *   .from(users)
   *   .union(
   *     db.select({ name: customers.name }).from(customers)
   *   );
   * // or
   * import { union } from 'drizzle-orm/sqlite-core'
   *
   * await union(
   *   db.select({ name: users.name }).from(users),
   *   db.select({ name: customers.name }).from(customers)
   * );
   * ```
   */
  union = this.createSetOperator("union", false);
  /**
   * Adds `union all` set operator to the query.
   *
   * Calling this method will combine the result-set of the `select` statements and keep all duplicate rows that appear across them.
   *
   * See docs: {@link https://orm.drizzle.team/docs/set-operations#union-all}
   *
   * @example
   *
   * ```ts
   * // Select all transaction ids from both online and in-store sales
   * await db.select({ transaction: onlineSales.transactionId })
   *   .from(onlineSales)
   *   .unionAll(
   *     db.select({ transaction: inStoreSales.transactionId }).from(inStoreSales)
   *   );
   * // or
   * import { unionAll } from 'drizzle-orm/sqlite-core'
   *
   * await unionAll(
   *   db.select({ transaction: onlineSales.transactionId }).from(onlineSales),
   *   db.select({ transaction: inStoreSales.transactionId }).from(inStoreSales)
   * );
   * ```
   */
  unionAll = this.createSetOperator("union", true);
  /**
   * Adds `intersect` set operator to the query.
   *
   * Calling this method will retain only the rows that are present in both result sets and eliminate duplicates.
   *
   * See docs: {@link https://orm.drizzle.team/docs/set-operations#intersect}
   *
   * @example
   *
   * ```ts
   * // Select course names that are offered in both departments A and B
   * await db.select({ courseName: depA.courseName })
   *   .from(depA)
   *   .intersect(
   *     db.select({ courseName: depB.courseName }).from(depB)
   *   );
   * // or
   * import { intersect } from 'drizzle-orm/sqlite-core'
   *
   * await intersect(
   *   db.select({ courseName: depA.courseName }).from(depA),
   *   db.select({ courseName: depB.courseName }).from(depB)
   * );
   * ```
   */
  intersect = this.createSetOperator("intersect", false);
  /**
   * Adds `except` set operator to the query.
   *
   * Calling this method will retrieve all unique rows from the left query, except for the rows that are present in the result set of the right query.
   *
   * See docs: {@link https://orm.drizzle.team/docs/set-operations#except}
   *
   * @example
   *
   * ```ts
   * // Select all courses offered in department A but not in department B
   * await db.select({ courseName: depA.courseName })
   *   .from(depA)
   *   .except(
   *     db.select({ courseName: depB.courseName }).from(depB)
   *   );
   * // or
   * import { except } from 'drizzle-orm/sqlite-core'
   *
   * await except(
   *   db.select({ courseName: depA.courseName }).from(depA),
   *   db.select({ courseName: depB.courseName }).from(depB)
   * );
   * ```
   */
  except = this.createSetOperator("except", false);
  /** @internal */
  addSetOperators(setOperators) {
    this.config.setOperators.push(...setOperators);
    return this;
  }
  /**
   * Adds a `where` clause to the query.
   *
   * Calling this method will select only those rows that fulfill a specified condition.
   *
   * See docs: {@link https://orm.drizzle.team/docs/select#filtering}
   *
   * @param where the `where` clause.
   *
   * @example
   * You can use conditional operators and `sql function` to filter the rows to be selected.
   *
   * ```ts
   * // Select all cars with green color
   * await db.select().from(cars).where(eq(cars.color, 'green'));
   * // or
   * await db.select().from(cars).where(sql`${cars.color} = 'green'`)
   * ```
   *
   * You can logically combine conditional operators with `and()` and `or()` operators:
   *
   * ```ts
   * // Select all BMW cars with a green color
   * await db.select().from(cars).where(and(eq(cars.color, 'green'), eq(cars.brand, 'BMW')));
   *
   * // Select all cars with the green or blue color
   * await db.select().from(cars).where(or(eq(cars.color, 'green'), eq(cars.color, 'blue')));
   * ```
   */
  where(where) {
    if (typeof where === "function") {
      where = where(
        new Proxy(
          this.config.fields,
          new SelectionProxyHandler({ sqlAliasedBehavior: "sql", sqlBehavior: "sql" })
        )
      );
    }
    this.config.where = where;
    return this;
  }
  /**
   * Adds a `having` clause to the query.
   *
   * Calling this method will select only those rows that fulfill a specified condition. It is typically used with aggregate functions to filter the aggregated data based on a specified condition.
   *
   * See docs: {@link https://orm.drizzle.team/docs/select#aggregations}
   *
   * @param having the `having` clause.
   *
   * @example
   *
   * ```ts
   * // Select all brands with more than one car
   * await db.select({
   * 	brand: cars.brand,
   * 	count: sql<number>`cast(count(${cars.id}) as int)`,
   * })
   *   .from(cars)
   *   .groupBy(cars.brand)
   *   .having(({ count }) => gt(count, 1));
   * ```
   */
  having(having) {
    if (typeof having === "function") {
      having = having(
        new Proxy(
          this.config.fields,
          new SelectionProxyHandler({ sqlAliasedBehavior: "sql", sqlBehavior: "sql" })
        )
      );
    }
    this.config.having = having;
    return this;
  }
  groupBy(...columns) {
    if (typeof columns[0] === "function") {
      const groupBy = columns[0](
        new Proxy(
          this.config.fields,
          new SelectionProxyHandler({ sqlAliasedBehavior: "alias", sqlBehavior: "sql" })
        )
      );
      this.config.groupBy = Array.isArray(groupBy) ? groupBy : [groupBy];
    } else {
      this.config.groupBy = columns;
    }
    return this;
  }
  orderBy(...columns) {
    if (typeof columns[0] === "function") {
      const orderBy = columns[0](
        new Proxy(
          this.config.fields,
          new SelectionProxyHandler({ sqlAliasedBehavior: "alias", sqlBehavior: "sql" })
        )
      );
      const orderByArray = Array.isArray(orderBy) ? orderBy : [orderBy];
      if (this.config.setOperators.length > 0) {
        this.config.setOperators.at(-1).orderBy = orderByArray;
      } else {
        this.config.orderBy = orderByArray;
      }
    } else {
      const orderByArray = columns;
      if (this.config.setOperators.length > 0) {
        this.config.setOperators.at(-1).orderBy = orderByArray;
      } else {
        this.config.orderBy = orderByArray;
      }
    }
    return this;
  }
  /**
   * Adds a `limit` clause to the query.
   *
   * Calling this method will set the maximum number of rows that will be returned by this query.
   *
   * See docs: {@link https://orm.drizzle.team/docs/select#limit--offset}
   *
   * @param limit the `limit` clause.
   *
   * @example
   *
   * ```ts
   * // Get the first 10 people from this query.
   * await db.select().from(people).limit(10);
   * ```
   */
  limit(limit) {
    if (this.config.setOperators.length > 0) {
      this.config.setOperators.at(-1).limit = limit;
    } else {
      this.config.limit = limit;
    }
    return this;
  }
  /**
   * Adds an `offset` clause to the query.
   *
   * Calling this method will skip a number of rows when returning results from this query.
   *
   * See docs: {@link https://orm.drizzle.team/docs/select#limit--offset}
   *
   * @param offset the `offset` clause.
   *
   * @example
   *
   * ```ts
   * // Get the 10th-20th people from this query.
   * await db.select().from(people).offset(10).limit(10);
   * ```
   */
  offset(offset) {
    if (this.config.setOperators.length > 0) {
      this.config.setOperators.at(-1).offset = offset;
    } else {
      this.config.offset = offset;
    }
    return this;
  }
  /** @internal */
  getSQL() {
    return this.dialect.buildSelectQuery(this.config);
  }
  toSQL() {
    const { typings: _typings, ...rest } = this.dialect.sqlToQuery(this.getSQL());
    return rest;
  }
  as(alias) {
    const usedTables = [];
    usedTables.push(...extractUsedTable(this.config.table));
    if (this.config.joins) {
      for (const it of this.config.joins) usedTables.push(...extractUsedTable(it.table));
    }
    return new Proxy(
      new Subquery(this.getSQL(), this.config.fields, alias, false, [...new Set(usedTables)]),
      new SelectionProxyHandler({ alias, sqlAliasedBehavior: "alias", sqlBehavior: "error" })
    );
  }
  /** @internal */
  getSelectedFields() {
    return new Proxy(
      this.config.fields,
      new SelectionProxyHandler({ alias: this.tableName, sqlAliasedBehavior: "alias", sqlBehavior: "error" })
    );
  }
  $dynamic() {
    return this;
  }
};
var SQLiteSelectBase = class extends SQLiteSelectQueryBuilderBase {
  static {
    __name(this, "SQLiteSelectBase");
  }
  static [entityKind] = "SQLiteSelect";
  /** @internal */
  _prepare(isOneTimeQuery = true) {
    if (!this.session) {
      throw new Error("Cannot execute a query on a query builder. Please use a database instance instead.");
    }
    const fieldsList = orderSelectedFields(this.config.fields);
    const query = this.session[isOneTimeQuery ? "prepareOneTimeQuery" : "prepareQuery"](
      this.dialect.sqlToQuery(this.getSQL()),
      fieldsList,
      "all",
      true,
      void 0,
      {
        type: "select",
        tables: [...this.usedTables]
      },
      this.cacheConfig
    );
    query.joinsNotNullableMap = this.joinsNotNullableMap;
    return query;
  }
  $withCache(config) {
    this.cacheConfig = config === void 0 ? { config: {}, enable: true, autoInvalidate: true } : config === false ? { enable: false } : { enable: true, autoInvalidate: true, ...config };
    return this;
  }
  prepare() {
    return this._prepare(false);
  }
  run = /* @__PURE__ */ __name((placeholderValues) => {
    return this._prepare().run(placeholderValues);
  }, "run");
  all = /* @__PURE__ */ __name((placeholderValues) => {
    return this._prepare().all(placeholderValues);
  }, "all");
  get = /* @__PURE__ */ __name((placeholderValues) => {
    return this._prepare().get(placeholderValues);
  }, "get");
  values = /* @__PURE__ */ __name((placeholderValues) => {
    return this._prepare().values(placeholderValues);
  }, "values");
  async execute() {
    return this.all();
  }
};
applyMixins(SQLiteSelectBase, [QueryPromise]);
function createSetOperator(type, isAll) {
  return (leftSelect, rightSelect, ...restSelects) => {
    const setOperators = [rightSelect, ...restSelects].map((select) => ({
      type,
      isAll,
      rightSelect: select
    }));
    for (const setOperator of setOperators) {
      if (!haveSameKeys(leftSelect.getSelectedFields(), setOperator.rightSelect.getSelectedFields())) {
        throw new Error(
          "Set operator error (union / intersect / except): selected fields are not the same or are in a different order"
        );
      }
    }
    return leftSelect.addSetOperators(setOperators);
  };
}
__name(createSetOperator, "createSetOperator");
var getSQLiteSetOperators = /* @__PURE__ */ __name(() => ({
  union,
  unionAll,
  intersect,
  except
}), "getSQLiteSetOperators");
var union = createSetOperator("union", false);
var unionAll = createSetOperator("union", true);
var intersect = createSetOperator("intersect", false);
var except = createSetOperator("except", false);

// node_modules/.pnpm/drizzle-orm@0.45.1_@libsql+client@0.17.0_@types+better-sqlite3@7.6.13_better-sqlite3@12.6.2/node_modules/drizzle-orm/sqlite-core/query-builders/query-builder.js
var QueryBuilder = class {
  static {
    __name(this, "QueryBuilder");
  }
  static [entityKind] = "SQLiteQueryBuilder";
  dialect;
  dialectConfig;
  constructor(dialect) {
    this.dialect = is(dialect, SQLiteDialect) ? dialect : void 0;
    this.dialectConfig = is(dialect, SQLiteDialect) ? void 0 : dialect;
  }
  $with = /* @__PURE__ */ __name((alias, selection) => {
    const queryBuilder = this;
    const as = /* @__PURE__ */ __name((qb) => {
      if (typeof qb === "function") {
        qb = qb(queryBuilder);
      }
      return new Proxy(
        new WithSubquery(
          qb.getSQL(),
          selection ?? ("getSelectedFields" in qb ? qb.getSelectedFields() ?? {} : {}),
          alias,
          true
        ),
        new SelectionProxyHandler({ alias, sqlAliasedBehavior: "alias", sqlBehavior: "error" })
      );
    }, "as");
    return { as };
  }, "$with");
  with(...queries) {
    const self = this;
    function select(fields) {
      return new SQLiteSelectBuilder({
        fields: fields ?? void 0,
        session: void 0,
        dialect: self.getDialect(),
        withList: queries
      });
    }
    __name(select, "select");
    function selectDistinct(fields) {
      return new SQLiteSelectBuilder({
        fields: fields ?? void 0,
        session: void 0,
        dialect: self.getDialect(),
        withList: queries,
        distinct: true
      });
    }
    __name(selectDistinct, "selectDistinct");
    return { select, selectDistinct };
  }
  select(fields) {
    return new SQLiteSelectBuilder({ fields: fields ?? void 0, session: void 0, dialect: this.getDialect() });
  }
  selectDistinct(fields) {
    return new SQLiteSelectBuilder({
      fields: fields ?? void 0,
      session: void 0,
      dialect: this.getDialect(),
      distinct: true
    });
  }
  // Lazy load dialect to avoid circular dependency
  getDialect() {
    if (!this.dialect) {
      this.dialect = new SQLiteSyncDialect(this.dialectConfig);
    }
    return this.dialect;
  }
};

// node_modules/.pnpm/drizzle-orm@0.45.1_@libsql+client@0.17.0_@types+better-sqlite3@7.6.13_better-sqlite3@12.6.2/node_modules/drizzle-orm/sqlite-core/query-builders/insert.js
var SQLiteInsertBuilder = class {
  static {
    __name(this, "SQLiteInsertBuilder");
  }
  constructor(table, session, dialect, withList) {
    this.table = table;
    this.session = session;
    this.dialect = dialect;
    this.withList = withList;
  }
  static [entityKind] = "SQLiteInsertBuilder";
  values(values) {
    values = Array.isArray(values) ? values : [values];
    if (values.length === 0) {
      throw new Error("values() must be called with at least one value");
    }
    const mappedValues = values.map((entry) => {
      const result = {};
      const cols = this.table[Table.Symbol.Columns];
      for (const colKey of Object.keys(entry)) {
        const colValue = entry[colKey];
        result[colKey] = is(colValue, SQL) ? colValue : new Param(colValue, cols[colKey]);
      }
      return result;
    });
    return new SQLiteInsertBase(this.table, mappedValues, this.session, this.dialect, this.withList);
  }
  select(selectQuery) {
    const select = typeof selectQuery === "function" ? selectQuery(new QueryBuilder()) : selectQuery;
    if (!is(select, SQL) && !haveSameKeys(this.table[Columns], select._.selectedFields)) {
      throw new Error(
        "Insert select error: selected fields are not the same or are in a different order compared to the table definition"
      );
    }
    return new SQLiteInsertBase(this.table, select, this.session, this.dialect, this.withList, true);
  }
};
var SQLiteInsertBase = class extends QueryPromise {
  static {
    __name(this, "SQLiteInsertBase");
  }
  constructor(table, values, session, dialect, withList, select) {
    super();
    this.session = session;
    this.dialect = dialect;
    this.config = { table, values, withList, select };
  }
  static [entityKind] = "SQLiteInsert";
  /** @internal */
  config;
  returning(fields = this.config.table[SQLiteTable.Symbol.Columns]) {
    this.config.returning = orderSelectedFields(fields);
    return this;
  }
  /**
   * Adds an `on conflict do nothing` clause to the query.
   *
   * Calling this method simply avoids inserting a row as its alternative action.
   *
   * See docs: {@link https://orm.drizzle.team/docs/insert#on-conflict-do-nothing}
   *
   * @param config The `target` and `where` clauses.
   *
   * @example
   * ```ts
   * // Insert one row and cancel the insert if there's a conflict
   * await db.insert(cars)
   *   .values({ id: 1, brand: 'BMW' })
   *   .onConflictDoNothing();
   *
   * // Explicitly specify conflict target
   * await db.insert(cars)
   *   .values({ id: 1, brand: 'BMW' })
   *   .onConflictDoNothing({ target: cars.id });
   * ```
   */
  onConflictDoNothing(config = {}) {
    if (!this.config.onConflict) this.config.onConflict = [];
    if (config.target === void 0) {
      this.config.onConflict.push(sql` on conflict do nothing`);
    } else {
      const targetSql = Array.isArray(config.target) ? sql`${config.target}` : sql`${[config.target]}`;
      const whereSql = config.where ? sql` where ${config.where}` : sql``;
      this.config.onConflict.push(sql` on conflict ${targetSql} do nothing${whereSql}`);
    }
    return this;
  }
  /**
   * Adds an `on conflict do update` clause to the query.
   *
   * Calling this method will update the existing row that conflicts with the row proposed for insertion as its alternative action.
   *
   * See docs: {@link https://orm.drizzle.team/docs/insert#upserts-and-conflicts}
   *
   * @param config The `target`, `set` and `where` clauses.
   *
   * @example
   * ```ts
   * // Update the row if there's a conflict
   * await db.insert(cars)
   *   .values({ id: 1, brand: 'BMW' })
   *   .onConflictDoUpdate({
   *     target: cars.id,
   *     set: { brand: 'Porsche' }
   *   });
   *
   * // Upsert with 'where' clause
   * await db.insert(cars)
   *   .values({ id: 1, brand: 'BMW' })
   *   .onConflictDoUpdate({
   *     target: cars.id,
   *     set: { brand: 'newBMW' },
   *     where: sql`${cars.createdAt} > '2023-01-01'::date`,
   *   });
   * ```
   */
  onConflictDoUpdate(config) {
    if (config.where && (config.targetWhere || config.setWhere)) {
      throw new Error(
        'You cannot use both "where" and "targetWhere"/"setWhere" at the same time - "where" is deprecated, use "targetWhere" or "setWhere" instead.'
      );
    }
    if (!this.config.onConflict) this.config.onConflict = [];
    const whereSql = config.where ? sql` where ${config.where}` : void 0;
    const targetWhereSql = config.targetWhere ? sql` where ${config.targetWhere}` : void 0;
    const setWhereSql = config.setWhere ? sql` where ${config.setWhere}` : void 0;
    const targetSql = Array.isArray(config.target) ? sql`${config.target}` : sql`${[config.target]}`;
    const setSql = this.dialect.buildUpdateSet(this.config.table, mapUpdateSet(this.config.table, config.set));
    this.config.onConflict.push(
      sql` on conflict ${targetSql}${targetWhereSql} do update set ${setSql}${whereSql}${setWhereSql}`
    );
    return this;
  }
  /** @internal */
  getSQL() {
    return this.dialect.buildInsertQuery(this.config);
  }
  toSQL() {
    const { typings: _typings, ...rest } = this.dialect.sqlToQuery(this.getSQL());
    return rest;
  }
  /** @internal */
  _prepare(isOneTimeQuery = true) {
    return this.session[isOneTimeQuery ? "prepareOneTimeQuery" : "prepareQuery"](
      this.dialect.sqlToQuery(this.getSQL()),
      this.config.returning,
      this.config.returning ? "all" : "run",
      true,
      void 0,
      {
        type: "insert",
        tables: extractUsedTable(this.config.table)
      }
    );
  }
  prepare() {
    return this._prepare(false);
  }
  run = /* @__PURE__ */ __name((placeholderValues) => {
    return this._prepare().run(placeholderValues);
  }, "run");
  all = /* @__PURE__ */ __name((placeholderValues) => {
    return this._prepare().all(placeholderValues);
  }, "all");
  get = /* @__PURE__ */ __name((placeholderValues) => {
    return this._prepare().get(placeholderValues);
  }, "get");
  values = /* @__PURE__ */ __name((placeholderValues) => {
    return this._prepare().values(placeholderValues);
  }, "values");
  async execute() {
    return this.config.returning ? this.all() : this.run();
  }
  $dynamic() {
    return this;
  }
};

// node_modules/.pnpm/drizzle-orm@0.45.1_@libsql+client@0.17.0_@types+better-sqlite3@7.6.13_better-sqlite3@12.6.2/node_modules/drizzle-orm/sqlite-core/query-builders/update.js
var SQLiteUpdateBuilder = class {
  static {
    __name(this, "SQLiteUpdateBuilder");
  }
  constructor(table, session, dialect, withList) {
    this.table = table;
    this.session = session;
    this.dialect = dialect;
    this.withList = withList;
  }
  static [entityKind] = "SQLiteUpdateBuilder";
  set(values) {
    return new SQLiteUpdateBase(
      this.table,
      mapUpdateSet(this.table, values),
      this.session,
      this.dialect,
      this.withList
    );
  }
};
var SQLiteUpdateBase = class extends QueryPromise {
  static {
    __name(this, "SQLiteUpdateBase");
  }
  constructor(table, set, session, dialect, withList) {
    super();
    this.session = session;
    this.dialect = dialect;
    this.config = { set, table, withList, joins: [] };
  }
  static [entityKind] = "SQLiteUpdate";
  /** @internal */
  config;
  from(source) {
    this.config.from = source;
    return this;
  }
  createJoin(joinType) {
    return (table, on) => {
      const tableName = getTableLikeName(table);
      if (typeof tableName === "string" && this.config.joins.some((join) => join.alias === tableName)) {
        throw new Error(`Alias "${tableName}" is already used in this query`);
      }
      if (typeof on === "function") {
        const from = this.config.from ? is(table, SQLiteTable) ? table[Table.Symbol.Columns] : is(table, Subquery) ? table._.selectedFields : is(table, SQLiteViewBase) ? table[ViewBaseConfig].selectedFields : void 0 : void 0;
        on = on(
          new Proxy(
            this.config.table[Table.Symbol.Columns],
            new SelectionProxyHandler({ sqlAliasedBehavior: "sql", sqlBehavior: "sql" })
          ),
          from && new Proxy(
            from,
            new SelectionProxyHandler({ sqlAliasedBehavior: "sql", sqlBehavior: "sql" })
          )
        );
      }
      this.config.joins.push({ on, table, joinType, alias: tableName });
      return this;
    };
  }
  leftJoin = this.createJoin("left");
  rightJoin = this.createJoin("right");
  innerJoin = this.createJoin("inner");
  fullJoin = this.createJoin("full");
  /**
   * Adds a 'where' clause to the query.
   *
   * Calling this method will update only those rows that fulfill a specified condition.
   *
   * See docs: {@link https://orm.drizzle.team/docs/update}
   *
   * @param where the 'where' clause.
   *
   * @example
   * You can use conditional operators and `sql function` to filter the rows to be updated.
   *
   * ```ts
   * // Update all cars with green color
   * db.update(cars).set({ color: 'red' })
   *   .where(eq(cars.color, 'green'));
   * // or
   * db.update(cars).set({ color: 'red' })
   *   .where(sql`${cars.color} = 'green'`)
   * ```
   *
   * You can logically combine conditional operators with `and()` and `or()` operators:
   *
   * ```ts
   * // Update all BMW cars with a green color
   * db.update(cars).set({ color: 'red' })
   *   .where(and(eq(cars.color, 'green'), eq(cars.brand, 'BMW')));
   *
   * // Update all cars with the green or blue color
   * db.update(cars).set({ color: 'red' })
   *   .where(or(eq(cars.color, 'green'), eq(cars.color, 'blue')));
   * ```
   */
  where(where) {
    this.config.where = where;
    return this;
  }
  orderBy(...columns) {
    if (typeof columns[0] === "function") {
      const orderBy = columns[0](
        new Proxy(
          this.config.table[Table.Symbol.Columns],
          new SelectionProxyHandler({ sqlAliasedBehavior: "alias", sqlBehavior: "sql" })
        )
      );
      const orderByArray = Array.isArray(orderBy) ? orderBy : [orderBy];
      this.config.orderBy = orderByArray;
    } else {
      const orderByArray = columns;
      this.config.orderBy = orderByArray;
    }
    return this;
  }
  limit(limit) {
    this.config.limit = limit;
    return this;
  }
  returning(fields = this.config.table[SQLiteTable.Symbol.Columns]) {
    this.config.returning = orderSelectedFields(fields);
    return this;
  }
  /** @internal */
  getSQL() {
    return this.dialect.buildUpdateQuery(this.config);
  }
  toSQL() {
    const { typings: _typings, ...rest } = this.dialect.sqlToQuery(this.getSQL());
    return rest;
  }
  /** @internal */
  _prepare(isOneTimeQuery = true) {
    return this.session[isOneTimeQuery ? "prepareOneTimeQuery" : "prepareQuery"](
      this.dialect.sqlToQuery(this.getSQL()),
      this.config.returning,
      this.config.returning ? "all" : "run",
      true,
      void 0,
      {
        type: "insert",
        tables: extractUsedTable(this.config.table)
      }
    );
  }
  prepare() {
    return this._prepare(false);
  }
  run = /* @__PURE__ */ __name((placeholderValues) => {
    return this._prepare().run(placeholderValues);
  }, "run");
  all = /* @__PURE__ */ __name((placeholderValues) => {
    return this._prepare().all(placeholderValues);
  }, "all");
  get = /* @__PURE__ */ __name((placeholderValues) => {
    return this._prepare().get(placeholderValues);
  }, "get");
  values = /* @__PURE__ */ __name((placeholderValues) => {
    return this._prepare().values(placeholderValues);
  }, "values");
  async execute() {
    return this.config.returning ? this.all() : this.run();
  }
  $dynamic() {
    return this;
  }
};

// node_modules/.pnpm/drizzle-orm@0.45.1_@libsql+client@0.17.0_@types+better-sqlite3@7.6.13_better-sqlite3@12.6.2/node_modules/drizzle-orm/sqlite-core/query-builders/count.js
var SQLiteCountBuilder = class _SQLiteCountBuilder extends SQL {
  static {
    __name(this, "SQLiteCountBuilder");
  }
  constructor(params) {
    super(_SQLiteCountBuilder.buildEmbeddedCount(params.source, params.filters).queryChunks);
    this.params = params;
    this.session = params.session;
    this.sql = _SQLiteCountBuilder.buildCount(
      params.source,
      params.filters
    );
  }
  sql;
  static [entityKind] = "SQLiteCountBuilderAsync";
  [Symbol.toStringTag] = "SQLiteCountBuilderAsync";
  session;
  static buildEmbeddedCount(source, filters) {
    return sql`(select count(*) from ${source}${sql.raw(" where ").if(filters)}${filters})`;
  }
  static buildCount(source, filters) {
    return sql`select count(*) from ${source}${sql.raw(" where ").if(filters)}${filters}`;
  }
  then(onfulfilled, onrejected) {
    return Promise.resolve(this.session.count(this.sql)).then(
      onfulfilled,
      onrejected
    );
  }
  catch(onRejected) {
    return this.then(void 0, onRejected);
  }
  finally(onFinally) {
    return this.then(
      (value) => {
        onFinally?.();
        return value;
      },
      (reason) => {
        onFinally?.();
        throw reason;
      }
    );
  }
};

// node_modules/.pnpm/drizzle-orm@0.45.1_@libsql+client@0.17.0_@types+better-sqlite3@7.6.13_better-sqlite3@12.6.2/node_modules/drizzle-orm/sqlite-core/query-builders/query.js
var RelationalQueryBuilder = class {
  static {
    __name(this, "RelationalQueryBuilder");
  }
  constructor(mode, fullSchema, schema, tableNamesMap, table, tableConfig, dialect, session) {
    this.mode = mode;
    this.fullSchema = fullSchema;
    this.schema = schema;
    this.tableNamesMap = tableNamesMap;
    this.table = table;
    this.tableConfig = tableConfig;
    this.dialect = dialect;
    this.session = session;
  }
  static [entityKind] = "SQLiteAsyncRelationalQueryBuilder";
  findMany(config) {
    return this.mode === "sync" ? new SQLiteSyncRelationalQuery(
      this.fullSchema,
      this.schema,
      this.tableNamesMap,
      this.table,
      this.tableConfig,
      this.dialect,
      this.session,
      config ? config : {},
      "many"
    ) : new SQLiteRelationalQuery(
      this.fullSchema,
      this.schema,
      this.tableNamesMap,
      this.table,
      this.tableConfig,
      this.dialect,
      this.session,
      config ? config : {},
      "many"
    );
  }
  findFirst(config) {
    return this.mode === "sync" ? new SQLiteSyncRelationalQuery(
      this.fullSchema,
      this.schema,
      this.tableNamesMap,
      this.table,
      this.tableConfig,
      this.dialect,
      this.session,
      config ? { ...config, limit: 1 } : { limit: 1 },
      "first"
    ) : new SQLiteRelationalQuery(
      this.fullSchema,
      this.schema,
      this.tableNamesMap,
      this.table,
      this.tableConfig,
      this.dialect,
      this.session,
      config ? { ...config, limit: 1 } : { limit: 1 },
      "first"
    );
  }
};
var SQLiteRelationalQuery = class extends QueryPromise {
  static {
    __name(this, "SQLiteRelationalQuery");
  }
  constructor(fullSchema, schema, tableNamesMap, table, tableConfig, dialect, session, config, mode) {
    super();
    this.fullSchema = fullSchema;
    this.schema = schema;
    this.tableNamesMap = tableNamesMap;
    this.table = table;
    this.tableConfig = tableConfig;
    this.dialect = dialect;
    this.session = session;
    this.config = config;
    this.mode = mode;
  }
  static [entityKind] = "SQLiteAsyncRelationalQuery";
  /** @internal */
  mode;
  /** @internal */
  getSQL() {
    return this.dialect.buildRelationalQuery({
      fullSchema: this.fullSchema,
      schema: this.schema,
      tableNamesMap: this.tableNamesMap,
      table: this.table,
      tableConfig: this.tableConfig,
      queryConfig: this.config,
      tableAlias: this.tableConfig.tsName
    }).sql;
  }
  /** @internal */
  _prepare(isOneTimeQuery = false) {
    const { query, builtQuery } = this._toSQL();
    return this.session[isOneTimeQuery ? "prepareOneTimeQuery" : "prepareQuery"](
      builtQuery,
      void 0,
      this.mode === "first" ? "get" : "all",
      true,
      (rawRows, mapColumnValue) => {
        const rows = rawRows.map(
          (row) => mapRelationalRow(this.schema, this.tableConfig, row, query.selection, mapColumnValue)
        );
        if (this.mode === "first") {
          return rows[0];
        }
        return rows;
      }
    );
  }
  prepare() {
    return this._prepare(false);
  }
  _toSQL() {
    const query = this.dialect.buildRelationalQuery({
      fullSchema: this.fullSchema,
      schema: this.schema,
      tableNamesMap: this.tableNamesMap,
      table: this.table,
      tableConfig: this.tableConfig,
      queryConfig: this.config,
      tableAlias: this.tableConfig.tsName
    });
    const builtQuery = this.dialect.sqlToQuery(query.sql);
    return { query, builtQuery };
  }
  toSQL() {
    return this._toSQL().builtQuery;
  }
  /** @internal */
  executeRaw() {
    if (this.mode === "first") {
      return this._prepare(false).get();
    }
    return this._prepare(false).all();
  }
  async execute() {
    return this.executeRaw();
  }
};
var SQLiteSyncRelationalQuery = class extends SQLiteRelationalQuery {
  static {
    __name(this, "SQLiteSyncRelationalQuery");
  }
  static [entityKind] = "SQLiteSyncRelationalQuery";
  sync() {
    return this.executeRaw();
  }
};

// node_modules/.pnpm/drizzle-orm@0.45.1_@libsql+client@0.17.0_@types+better-sqlite3@7.6.13_better-sqlite3@12.6.2/node_modules/drizzle-orm/sqlite-core/query-builders/raw.js
var SQLiteRaw = class extends QueryPromise {
  static {
    __name(this, "SQLiteRaw");
  }
  constructor(execute, getSQL, action, dialect, mapBatchResult) {
    super();
    this.execute = execute;
    this.getSQL = getSQL;
    this.dialect = dialect;
    this.mapBatchResult = mapBatchResult;
    this.config = { action };
  }
  static [entityKind] = "SQLiteRaw";
  /** @internal */
  config;
  getQuery() {
    return { ...this.dialect.sqlToQuery(this.getSQL()), method: this.config.action };
  }
  mapResult(result, isFromBatch) {
    return isFromBatch ? this.mapBatchResult(result) : result;
  }
  _prepare() {
    return this;
  }
  /** @internal */
  isResponseInArrayMode() {
    return false;
  }
};

// node_modules/.pnpm/drizzle-orm@0.45.1_@libsql+client@0.17.0_@types+better-sqlite3@7.6.13_better-sqlite3@12.6.2/node_modules/drizzle-orm/sqlite-core/db.js
var BaseSQLiteDatabase = class {
  static {
    __name(this, "BaseSQLiteDatabase");
  }
  constructor(resultKind, dialect, session, schema) {
    this.resultKind = resultKind;
    this.dialect = dialect;
    this.session = session;
    this._ = schema ? {
      schema: schema.schema,
      fullSchema: schema.fullSchema,
      tableNamesMap: schema.tableNamesMap
    } : {
      schema: void 0,
      fullSchema: {},
      tableNamesMap: {}
    };
    this.query = {};
    const query = this.query;
    if (this._.schema) {
      for (const [tableName, columns] of Object.entries(this._.schema)) {
        query[tableName] = new RelationalQueryBuilder(
          resultKind,
          schema.fullSchema,
          this._.schema,
          this._.tableNamesMap,
          schema.fullSchema[tableName],
          columns,
          dialect,
          session
        );
      }
    }
    this.$cache = { invalidate: /* @__PURE__ */ __name(async (_params) => {
    }, "invalidate") };
  }
  static [entityKind] = "BaseSQLiteDatabase";
  query;
  /**
   * Creates a subquery that defines a temporary named result set as a CTE.
   *
   * It is useful for breaking down complex queries into simpler parts and for reusing the result set in subsequent parts of the query.
   *
   * See docs: {@link https://orm.drizzle.team/docs/select#with-clause}
   *
   * @param alias The alias for the subquery.
   *
   * Failure to provide an alias will result in a DrizzleTypeError, preventing the subquery from being referenced in other queries.
   *
   * @example
   *
   * ```ts
   * // Create a subquery with alias 'sq' and use it in the select query
   * const sq = db.$with('sq').as(db.select().from(users).where(eq(users.id, 42)));
   *
   * const result = await db.with(sq).select().from(sq);
   * ```
   *
   * To select arbitrary SQL values as fields in a CTE and reference them in other CTEs or in the main query, you need to add aliases to them:
   *
   * ```ts
   * // Select an arbitrary SQL value as a field in a CTE and reference it in the main query
   * const sq = db.$with('sq').as(db.select({
   *   name: sql<string>`upper(${users.name})`.as('name'),
   * })
   * .from(users));
   *
   * const result = await db.with(sq).select({ name: sq.name }).from(sq);
   * ```
   */
  $with = /* @__PURE__ */ __name((alias, selection) => {
    const self = this;
    const as = /* @__PURE__ */ __name((qb) => {
      if (typeof qb === "function") {
        qb = qb(new QueryBuilder(self.dialect));
      }
      return new Proxy(
        new WithSubquery(
          qb.getSQL(),
          selection ?? ("getSelectedFields" in qb ? qb.getSelectedFields() ?? {} : {}),
          alias,
          true
        ),
        new SelectionProxyHandler({ alias, sqlAliasedBehavior: "alias", sqlBehavior: "error" })
      );
    }, "as");
    return { as };
  }, "$with");
  $count(source, filters) {
    return new SQLiteCountBuilder({ source, filters, session: this.session });
  }
  /**
   * Incorporates a previously defined CTE (using `$with`) into the main query.
   *
   * This method allows the main query to reference a temporary named result set.
   *
   * See docs: {@link https://orm.drizzle.team/docs/select#with-clause}
   *
   * @param queries The CTEs to incorporate into the main query.
   *
   * @example
   *
   * ```ts
   * // Define a subquery 'sq' as a CTE using $with
   * const sq = db.$with('sq').as(db.select().from(users).where(eq(users.id, 42)));
   *
   * // Incorporate the CTE 'sq' into the main query and select from it
   * const result = await db.with(sq).select().from(sq);
   * ```
   */
  with(...queries) {
    const self = this;
    function select(fields) {
      return new SQLiteSelectBuilder({
        fields: fields ?? void 0,
        session: self.session,
        dialect: self.dialect,
        withList: queries
      });
    }
    __name(select, "select");
    function selectDistinct(fields) {
      return new SQLiteSelectBuilder({
        fields: fields ?? void 0,
        session: self.session,
        dialect: self.dialect,
        withList: queries,
        distinct: true
      });
    }
    __name(selectDistinct, "selectDistinct");
    function update(table) {
      return new SQLiteUpdateBuilder(table, self.session, self.dialect, queries);
    }
    __name(update, "update");
    function insert(into) {
      return new SQLiteInsertBuilder(into, self.session, self.dialect, queries);
    }
    __name(insert, "insert");
    function delete_(from) {
      return new SQLiteDeleteBase(from, self.session, self.dialect, queries);
    }
    __name(delete_, "delete_");
    return { select, selectDistinct, update, insert, delete: delete_ };
  }
  select(fields) {
    return new SQLiteSelectBuilder({ fields: fields ?? void 0, session: this.session, dialect: this.dialect });
  }
  selectDistinct(fields) {
    return new SQLiteSelectBuilder({
      fields: fields ?? void 0,
      session: this.session,
      dialect: this.dialect,
      distinct: true
    });
  }
  /**
   * Creates an update query.
   *
   * Calling this method without `.where()` clause will update all rows in a table. The `.where()` clause specifies which rows should be updated.
   *
   * Use `.set()` method to specify which values to update.
   *
   * See docs: {@link https://orm.drizzle.team/docs/update}
   *
   * @param table The table to update.
   *
   * @example
   *
   * ```ts
   * // Update all rows in the 'cars' table
   * await db.update(cars).set({ color: 'red' });
   *
   * // Update rows with filters and conditions
   * await db.update(cars).set({ color: 'red' }).where(eq(cars.brand, 'BMW'));
   *
   * // Update with returning clause
   * const updatedCar: Car[] = await db.update(cars)
   *   .set({ color: 'red' })
   *   .where(eq(cars.id, 1))
   *   .returning();
   * ```
   */
  update(table) {
    return new SQLiteUpdateBuilder(table, this.session, this.dialect);
  }
  $cache;
  /**
   * Creates an insert query.
   *
   * Calling this method will create new rows in a table. Use `.values()` method to specify which values to insert.
   *
   * See docs: {@link https://orm.drizzle.team/docs/insert}
   *
   * @param table The table to insert into.
   *
   * @example
   *
   * ```ts
   * // Insert one row
   * await db.insert(cars).values({ brand: 'BMW' });
   *
   * // Insert multiple rows
   * await db.insert(cars).values([{ brand: 'BMW' }, { brand: 'Porsche' }]);
   *
   * // Insert with returning clause
   * const insertedCar: Car[] = await db.insert(cars)
   *   .values({ brand: 'BMW' })
   *   .returning();
   * ```
   */
  insert(into) {
    return new SQLiteInsertBuilder(into, this.session, this.dialect);
  }
  /**
   * Creates a delete query.
   *
   * Calling this method without `.where()` clause will delete all rows in a table. The `.where()` clause specifies which rows should be deleted.
   *
   * See docs: {@link https://orm.drizzle.team/docs/delete}
   *
   * @param table The table to delete from.
   *
   * @example
   *
   * ```ts
   * // Delete all rows in the 'cars' table
   * await db.delete(cars);
   *
   * // Delete rows with filters and conditions
   * await db.delete(cars).where(eq(cars.color, 'green'));
   *
   * // Delete with returning clause
   * const deletedCar: Car[] = await db.delete(cars)
   *   .where(eq(cars.id, 1))
   *   .returning();
   * ```
   */
  delete(from) {
    return new SQLiteDeleteBase(from, this.session, this.dialect);
  }
  run(query) {
    const sequel = typeof query === "string" ? sql.raw(query) : query.getSQL();
    if (this.resultKind === "async") {
      return new SQLiteRaw(
        async () => this.session.run(sequel),
        () => sequel,
        "run",
        this.dialect,
        this.session.extractRawRunValueFromBatchResult.bind(this.session)
      );
    }
    return this.session.run(sequel);
  }
  all(query) {
    const sequel = typeof query === "string" ? sql.raw(query) : query.getSQL();
    if (this.resultKind === "async") {
      return new SQLiteRaw(
        async () => this.session.all(sequel),
        () => sequel,
        "all",
        this.dialect,
        this.session.extractRawAllValueFromBatchResult.bind(this.session)
      );
    }
    return this.session.all(sequel);
  }
  get(query) {
    const sequel = typeof query === "string" ? sql.raw(query) : query.getSQL();
    if (this.resultKind === "async") {
      return new SQLiteRaw(
        async () => this.session.get(sequel),
        () => sequel,
        "get",
        this.dialect,
        this.session.extractRawGetValueFromBatchResult.bind(this.session)
      );
    }
    return this.session.get(sequel);
  }
  values(query) {
    const sequel = typeof query === "string" ? sql.raw(query) : query.getSQL();
    if (this.resultKind === "async") {
      return new SQLiteRaw(
        async () => this.session.values(sequel),
        () => sequel,
        "values",
        this.dialect,
        this.session.extractRawValuesValueFromBatchResult.bind(this.session)
      );
    }
    return this.session.values(sequel);
  }
  transaction(transaction, config) {
    return this.session.transaction(transaction, config);
  }
};

// node_modules/.pnpm/drizzle-orm@0.45.1_@libsql+client@0.17.0_@types+better-sqlite3@7.6.13_better-sqlite3@12.6.2/node_modules/drizzle-orm/cache/core/cache.js
var Cache = class {
  static {
    __name(this, "Cache");
  }
  static [entityKind] = "Cache";
};
var NoopCache = class extends Cache {
  static {
    __name(this, "NoopCache");
  }
  strategy() {
    return "all";
  }
  static [entityKind] = "NoopCache";
  async get(_key) {
    return void 0;
  }
  async put(_hashedQuery, _response, _tables, _config) {
  }
  async onMutate(_params) {
  }
};
async function hashQuery(sql2, params) {
  const dataToHash = `${sql2}-${JSON.stringify(params)}`;
  const encoder2 = new TextEncoder();
  const data = encoder2.encode(dataToHash);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = [...new Uint8Array(hashBuffer)];
  const hashHex = hashArray.map((b2) => b2.toString(16).padStart(2, "0")).join("");
  return hashHex;
}
__name(hashQuery, "hashQuery");

// node_modules/.pnpm/drizzle-orm@0.45.1_@libsql+client@0.17.0_@types+better-sqlite3@7.6.13_better-sqlite3@12.6.2/node_modules/drizzle-orm/sqlite-core/session.js
var ExecuteResultSync = class extends QueryPromise {
  static {
    __name(this, "ExecuteResultSync");
  }
  constructor(resultCb) {
    super();
    this.resultCb = resultCb;
  }
  static [entityKind] = "ExecuteResultSync";
  async execute() {
    return this.resultCb();
  }
  sync() {
    return this.resultCb();
  }
};
var SQLitePreparedQuery = class {
  static {
    __name(this, "SQLitePreparedQuery");
  }
  constructor(mode, executeMethod, query, cache2, queryMetadata, cacheConfig) {
    this.mode = mode;
    this.executeMethod = executeMethod;
    this.query = query;
    this.cache = cache2;
    this.queryMetadata = queryMetadata;
    this.cacheConfig = cacheConfig;
    if (cache2 && cache2.strategy() === "all" && cacheConfig === void 0) {
      this.cacheConfig = { enable: true, autoInvalidate: true };
    }
    if (!this.cacheConfig?.enable) {
      this.cacheConfig = void 0;
    }
  }
  static [entityKind] = "PreparedQuery";
  /** @internal */
  joinsNotNullableMap;
  /** @internal */
  async queryWithCache(queryString, params, query) {
    if (this.cache === void 0 || is(this.cache, NoopCache) || this.queryMetadata === void 0) {
      try {
        return await query();
      } catch (e) {
        throw new DrizzleQueryError(queryString, params, e);
      }
    }
    if (this.cacheConfig && !this.cacheConfig.enable) {
      try {
        return await query();
      } catch (e) {
        throw new DrizzleQueryError(queryString, params, e);
      }
    }
    if ((this.queryMetadata.type === "insert" || this.queryMetadata.type === "update" || this.queryMetadata.type === "delete") && this.queryMetadata.tables.length > 0) {
      try {
        const [res] = await Promise.all([
          query(),
          this.cache.onMutate({ tables: this.queryMetadata.tables })
        ]);
        return res;
      } catch (e) {
        throw new DrizzleQueryError(queryString, params, e);
      }
    }
    if (!this.cacheConfig) {
      try {
        return await query();
      } catch (e) {
        throw new DrizzleQueryError(queryString, params, e);
      }
    }
    if (this.queryMetadata.type === "select") {
      const fromCache = await this.cache.get(
        this.cacheConfig.tag ?? await hashQuery(queryString, params),
        this.queryMetadata.tables,
        this.cacheConfig.tag !== void 0,
        this.cacheConfig.autoInvalidate
      );
      if (fromCache === void 0) {
        let result;
        try {
          result = await query();
        } catch (e) {
          throw new DrizzleQueryError(queryString, params, e);
        }
        await this.cache.put(
          this.cacheConfig.tag ?? await hashQuery(queryString, params),
          result,
          // make sure we send tables that were used in a query only if user wants to invalidate it on each write
          this.cacheConfig.autoInvalidate ? this.queryMetadata.tables : [],
          this.cacheConfig.tag !== void 0,
          this.cacheConfig.config
        );
        return result;
      }
      return fromCache;
    }
    try {
      return await query();
    } catch (e) {
      throw new DrizzleQueryError(queryString, params, e);
    }
  }
  getQuery() {
    return this.query;
  }
  mapRunResult(result, _isFromBatch) {
    return result;
  }
  mapAllResult(_result, _isFromBatch) {
    throw new Error("Not implemented");
  }
  mapGetResult(_result, _isFromBatch) {
    throw new Error("Not implemented");
  }
  execute(placeholderValues) {
    if (this.mode === "async") {
      return this[this.executeMethod](placeholderValues);
    }
    return new ExecuteResultSync(() => this[this.executeMethod](placeholderValues));
  }
  mapResult(response, isFromBatch) {
    switch (this.executeMethod) {
      case "run": {
        return this.mapRunResult(response, isFromBatch);
      }
      case "all": {
        return this.mapAllResult(response, isFromBatch);
      }
      case "get": {
        return this.mapGetResult(response, isFromBatch);
      }
    }
  }
};
var SQLiteSession = class {
  static {
    __name(this, "SQLiteSession");
  }
  constructor(dialect) {
    this.dialect = dialect;
  }
  static [entityKind] = "SQLiteSession";
  prepareOneTimeQuery(query, fields, executeMethod, isResponseInArrayMode, customResultMapper, queryMetadata, cacheConfig) {
    return this.prepareQuery(
      query,
      fields,
      executeMethod,
      isResponseInArrayMode,
      customResultMapper,
      queryMetadata,
      cacheConfig
    );
  }
  run(query) {
    const staticQuery = this.dialect.sqlToQuery(query);
    try {
      return this.prepareOneTimeQuery(staticQuery, void 0, "run", false).run();
    } catch (err) {
      throw new DrizzleError({ cause: err, message: `Failed to run the query '${staticQuery.sql}'` });
    }
  }
  /** @internal */
  extractRawRunValueFromBatchResult(result) {
    return result;
  }
  all(query) {
    return this.prepareOneTimeQuery(this.dialect.sqlToQuery(query), void 0, "run", false).all();
  }
  /** @internal */
  extractRawAllValueFromBatchResult(_result) {
    throw new Error("Not implemented");
  }
  get(query) {
    return this.prepareOneTimeQuery(this.dialect.sqlToQuery(query), void 0, "run", false).get();
  }
  /** @internal */
  extractRawGetValueFromBatchResult(_result) {
    throw new Error("Not implemented");
  }
  values(query) {
    return this.prepareOneTimeQuery(this.dialect.sqlToQuery(query), void 0, "run", false).values();
  }
  async count(sql2) {
    const result = await this.values(sql2);
    return result[0][0];
  }
  /** @internal */
  extractRawValuesValueFromBatchResult(_result) {
    throw new Error("Not implemented");
  }
};
var SQLiteTransaction = class extends BaseSQLiteDatabase {
  static {
    __name(this, "SQLiteTransaction");
  }
  constructor(resultType, dialect, session, schema, nestedIndex = 0) {
    super(resultType, dialect, session, schema);
    this.schema = schema;
    this.nestedIndex = nestedIndex;
  }
  static [entityKind] = "SQLiteTransaction";
  rollback() {
    throw new TransactionRollbackError();
  }
};

// node_modules/.pnpm/drizzle-orm@0.45.1_@libsql+client@0.17.0_@types+better-sqlite3@7.6.13_better-sqlite3@12.6.2/node_modules/drizzle-orm/logger.js
var ConsoleLogWriter = class {
  static {
    __name(this, "ConsoleLogWriter");
  }
  static [entityKind] = "ConsoleLogWriter";
  write(message2) {
    console.log(message2);
  }
};
var DefaultLogger = class {
  static {
    __name(this, "DefaultLogger");
  }
  static [entityKind] = "DefaultLogger";
  writer;
  constructor(config) {
    this.writer = config?.writer ?? new ConsoleLogWriter();
  }
  logQuery(query, params) {
    const stringifiedParams = params.map((p2) => {
      try {
        return JSON.stringify(p2);
      } catch {
        return String(p2);
      }
    });
    const paramsStr = stringifiedParams.length ? ` -- params: [${stringifiedParams.join(", ")}]` : "";
    this.writer.write(`Query: ${query}${paramsStr}`);
  }
};
var NoopLogger = class {
  static {
    __name(this, "NoopLogger");
  }
  static [entityKind] = "NoopLogger";
  logQuery() {
  }
};

// packages/db/src/schema.ts
var ONBOARDING_STEPS = {
  /** User just created account, hasn't started onboarding */
  NOT_STARTED: 0,
  /** User has connected their ATS integration */
  ATS_CONNECTED: 1,
  /** User has generated their API key for desktop chat */
  API_KEY_GENERATED: 2,
  /** User has installed the browser extension */
  EXTENSION_INSTALLED: 2.5,
  /** User has configured deployment mode (web UI or desktop) */
  DEPLOYMENT_CONFIGURED: 3,
  /** Onboarding complete */
  COMPLETE: 4
};
var MAX_ONBOARDING_STEP = Math.max(...Object.values(ONBOARDING_STEPS));
var users = sqliteTable("users", {
  id: text("id").primaryKey(),
  // UUID
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  avatarUrl: text("avatar_url"),
  isAdmin: integer("is_admin", { mode: "boolean" }).notNull().default(false),
  // Org admin
  isSuperAdmin: integer("is_super_admin", { mode: "boolean" }).notNull().default(false),
  // System-wide admin
  organizationId: text("organization_id"),
  // FK added via migration (circular ref)
  /** Onboarding progress tracked as float for flexibility (see ONBOARDING_STEPS) */
  onboardingStep: real("onboarding_step").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date())
});
var sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date())
});
var organizations = sqliteTable("organizations", {
  id: text("id").primaryKey(),
  // UUID
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  // URL-friendly identifier
  logoUrl: text("logo_url"),
  // LLM Configuration (ephemeral architecture)
  llmProvider: text("llm_provider").default("anthropic"),
  // 'anthropic' | 'openai' | 'groq'
  llmApiKey: text("llm_api_key"),
  // Encrypted API key for org's LLM
  llmModel: text("llm_model"),
  // Model override (e.g., 'claude-sonnet-4-20250514')
  // ATS Configuration
  atsProvider: text("ats_provider"),
  // 'greenhouse' | 'lever' | 'ashby'
  atsBaseUrl: text("ats_base_url"),
  // ATS API base URL override
  // Deployment modes - which chat interfaces are enabled for the organization
  webUiEnabled: integer("web_ui_enabled", { mode: "boolean" }).notNull().default(false),
  desktopEnabled: integer("desktop_enabled", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date())
});
var organizationInvites = sqliteTable("organization_invites", {
  id: text("id").primaryKey(),
  // UUID
  organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  role: text("role").notNull().default("member"),
  // 'admin' | 'member'
  token: text("token").notNull().unique(),
  // Random invite token
  invitedBy: text("invited_by").notNull().references(() => users.id),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  acceptedAt: integer("accepted_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date())
});
var apiKeys = sqliteTable("api_keys", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  organizationId: text("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
  key: text("key").notNull(),
  // Full API key (sk_live_...) - retrievable anytime
  name: text("name").notNull(),
  // User-provided name like "My MacBook"
  lastUsedAt: integer("last_used_at", { mode: "timestamp" }),
  revokedAt: integer("revoked_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date())
});
var roles = sqliteTable("roles", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  // 'admin', 'recruiter', 'viewer'
  description: text("description"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date())
});
var permissions = sqliteTable("permissions", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  // 'skills:read', 'skills:execute', 'integrations:manage'
  resource: text("resource").notNull(),
  // 'skills', 'integrations', 'users', 'candidates'
  action: text("action").notNull(),
  // 'read', 'write', 'execute', 'manage'
  description: text("description")
});
var rolePermissions = sqliteTable("role_permissions", {
  roleId: text("role_id").notNull().references(() => roles.id, { onDelete: "cascade" }),
  permissionId: text("permission_id").notNull().references(() => permissions.id, { onDelete: "cascade" })
}, (table) => ({
  pk: primaryKey({ columns: [table.roleId, table.permissionId] })
}));
var userRoles = sqliteTable("user_roles", {
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  roleId: text("role_id").notNull().references(() => roles.id, { onDelete: "cascade" }),
  assignedAt: integer("assigned_at", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date()),
  assignedBy: text("assigned_by").references(() => users.id)
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.roleId] })
}));
var roleSkills = sqliteTable("role_skills", {
  roleId: text("role_id").notNull().references(() => roles.id, { onDelete: "cascade" }),
  skillId: text("skill_id").notNull().references(() => skills.id, { onDelete: "cascade" }),
  assignedAt: integer("assigned_at", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date())
}, (table) => ({
  pk: primaryKey({ columns: [table.roleId, table.skillId] })
}));
var skills = sqliteTable("skills", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  // 'linkedin-lookup'
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  // 'sourcing', 'communication', 'ats'
  version: text("version").notNull().default("1.0.0"),
  // Organization scoping
  organizationId: text("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
  isGlobal: integer("is_global", { mode: "boolean" }).notNull().default(true),
  // Global skills visible to all orgs
  // Frontmatter fields (progressive disclosure - Level 1 metadata)
  intent: text("intent"),
  // When to use this skill (e.g., "user asks to find candidates on LinkedIn")
  capabilities: text("capabilities"),
  // JSON array of what the skill can do
  // Full instructions (progressive disclosure - Level 2, loaded on demand)
  instructions: text("instructions"),
  // Full skill instructions in markdown
  // Metadata stored as JSON strings
  requiredIntegrations: text("required_integrations"),
  // JSON array
  requiredScopes: text("required_scopes"),
  // JSON array
  isEnabled: integer("is_enabled", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date())
});
var integrations = sqliteTable("integrations", {
  id: text("id").primaryKey(),
  provider: text("provider").notNull(),
  // 'linkedin', 'ats', 'email', 'google'
  nangoConnectionId: text("nango_connection_id"),
  // Nango's connection ID
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  organizationId: text("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("disconnected"),
  // 'connected', 'disconnected', 'error'
  lastSyncAt: integer("last_sync_at", { mode: "timestamp" }),
  metadata: text("metadata"),
  // JSON
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date())
}, (table) => ({
  userProviderIdx: index("integrations_user_provider_idx").on(table.userId, table.provider)
}));
var skillUsageLogs = sqliteTable("skill_usage_logs", {
  id: text("id").primaryKey(),
  skillId: text("skill_id").notNull().references(() => skills.id),
  userId: text("user_id").notNull().references(() => users.id),
  apiKeyId: text("api_key_id").references(() => apiKeys.id),
  organizationId: text("organization_id").references(() => organizations.id),
  status: text("status").notNull(),
  // 'success', 'error', 'partial'
  durationMs: integer("duration_ms"),
  inputSummary: text("input_summary"),
  // Truncated/anonymized input
  errorMessage: text("error_message"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date())
}, (table) => ({
  userIdIdx: index("skill_usage_logs_user_id_idx").on(table.userId),
  createdAtIdx: index("skill_usage_logs_created_at_idx").on(table.createdAt),
  userCreatedIdx: index("skill_usage_logs_user_created_idx").on(table.userId, table.createdAt),
  statusIdx: index("skill_usage_logs_status_idx").on(table.status)
}));
var scrapeTasks = sqliteTable("scrape_tasks", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  apiKeyId: text("api_key_id").references(() => apiKeys.id),
  organizationId: text("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  urlHash: text("url_hash").notNull(),
  // SHA-256 hash of normalized URL for deduplication
  status: text("status").notNull().default("pending"),
  // pending, processing, completed, failed, expired
  result: text("result"),
  // Markdown content
  errorMessage: text("error_message"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date()),
  claimedAt: integer("claimed_at", { mode: "timestamp" }),
  completedAt: integer("completed_at", { mode: "timestamp" }),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull()
}, (table) => ({
  urlHashUserIdx: index("scrape_tasks_url_hash_user_idx").on(table.urlHash, table.userId),
  statusIdx: index("scrape_tasks_status_idx").on(table.status),
  expiresAtIdx: index("scrape_tasks_expires_at_idx").on(table.expiresAt)
}));
var skillProposals = sqliteTable("skill_proposals", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  organizationId: text("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
  // Proposal content
  title: text("title").notNull(),
  description: text("description").notNull(),
  // Natural language description of desired functionality
  useCases: text("use_cases"),
  // JSON array of example use cases
  // Review status
  status: text("status").notNull().default("pending"),
  // 'pending', 'approved', 'denied'
  reviewedBy: text("reviewed_by").references(() => users.id),
  reviewedAt: integer("reviewed_at", { mode: "timestamp" }),
  reviewFeedback: text("review_feedback"),
  // Admin feedback (especially on denial)
  // If approved, link to created skill
  createdSkillId: text("created_skill_id").references(() => skills.id),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date())
});
var organizationsRelations = relations(organizations, ({ many }) => ({
  users: many(users),
  invites: many(organizationInvites),
  apiKeys: many(apiKeys),
  skills: many(skills),
  integrations: many(integrations),
  skillUsageLogs: many(skillUsageLogs),
  scrapeTasks: many(scrapeTasks),
  skillProposals: many(skillProposals)
}));
var organizationInvitesRelations = relations(organizationInvites, ({ one }) => ({
  organization: one(organizations, {
    fields: [organizationInvites.organizationId],
    references: [organizations.id]
  }),
  inviter: one(users, {
    fields: [organizationInvites.invitedBy],
    references: [users.id]
  })
}));
var usersRelations = relations(users, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [users.organizationId],
    references: [organizations.id]
  }),
  sessions: many(sessions),
  apiKeys: many(apiKeys),
  roles: many(userRoles),
  integrations: many(integrations),
  skillUsage: many(skillUsageLogs),
  scrapeTasks: many(scrapeTasks)
}));
var scrapeTasksRelations = relations(scrapeTasks, ({ one }) => ({
  user: one(users, {
    fields: [scrapeTasks.userId],
    references: [users.id]
  }),
  apiKey: one(apiKeys, {
    fields: [scrapeTasks.apiKeyId],
    references: [apiKeys.id]
  })
}));
var apiKeysRelations = relations(apiKeys, ({ one }) => ({
  user: one(users, {
    fields: [apiKeys.userId],
    references: [users.id]
  }),
  organization: one(organizations, {
    fields: [apiKeys.organizationId],
    references: [organizations.id]
  })
}));
var rolesRelations = relations(roles, ({ many }) => ({
  users: many(userRoles),
  permissions: many(rolePermissions),
  skills: many(roleSkills)
}));
var skillsRelations = relations(skills, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [skills.organizationId],
    references: [organizations.id]
  }),
  usageLogs: many(skillUsageLogs),
  roles: many(roleSkills)
}));
var skillProposalsRelations = relations(skillProposals, ({ one }) => ({
  user: one(users, {
    fields: [skillProposals.userId],
    references: [users.id]
  }),
  reviewer: one(users, {
    fields: [skillProposals.reviewedBy],
    references: [users.id]
  }),
  createdSkill: one(skills, {
    fields: [skillProposals.createdSkillId],
    references: [skills.id]
  })
}));
var integrationsRelations = relations(integrations, ({ one }) => ({
  user: one(users, {
    fields: [integrations.userId],
    references: [users.id]
  }),
  organization: one(organizations, {
    fields: [integrations.organizationId],
    references: [organizations.id]
  })
}));
var errorEvents = sqliteTable("error_events", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  // Classification (no PII - standardized codes only)
  errorCode: text("error_code").notNull(),
  // e.g., 'LLM_RATE_LIMITED', 'ATS_AUTH_FAILED'
  errorCategory: text("error_category").notNull(),
  // 'llm', 'ats', 'skill', 'scrape', 'integration', 'system'
  // Attribution context (no PII)
  skillSlug: text("skill_slug"),
  provider: text("provider"),
  // 'anthropic', 'openai', 'greenhouse', etc.
  action: text("action"),
  // 'search_candidates', 'load_skill', etc.
  httpStatus: integer("http_status"),
  // Correlation
  sessionId: text("session_id"),
  // Client session UUID (not user identity)
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date())
}, (table) => ({
  createdAtIdx: index("error_events_created_at_idx").on(table.createdAt),
  categoryIdx: index("error_events_category_idx").on(table.errorCategory),
  orgCreatedIdx: index("error_events_org_created_idx").on(table.organizationId, table.createdAt)
}));
var errorEventsRelations = relations(errorEvents, ({ one }) => ({
  organization: one(organizations, {
    fields: [errorEvents.organizationId],
    references: [organizations.id]
  }),
  user: one(users, {
    fields: [errorEvents.userId],
    references: [users.id]
  })
}));
var systemSettings = sqliteTable("system_settings", {
  key: text("key").primaryKey(),
  // 'llm.anthropic_api_key', 'llm.openai_api_key', etc.
  value: text("value").notNull(),
  // Encrypted for sensitive values
  isSecret: integer("is_secret", { mode: "boolean" }).notNull().default(false),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date()),
  updatedBy: text("updated_by").references(() => users.id)
});

// node_modules/.pnpm/drizzle-orm@0.45.1_@libsql+client@0.17.0_@types+better-sqlite3@7.6.13_better-sqlite3@12.6.2/node_modules/drizzle-orm/better-sqlite3/driver.js
import Client from "better-sqlite3";

// node_modules/.pnpm/drizzle-orm@0.45.1_@libsql+client@0.17.0_@types+better-sqlite3@7.6.13_better-sqlite3@12.6.2/node_modules/drizzle-orm/better-sqlite3/session.js
var BetterSQLiteSession = class extends SQLiteSession {
  static {
    __name(this, "BetterSQLiteSession");
  }
  constructor(client, dialect, schema, options = {}) {
    super(dialect);
    this.client = client;
    this.schema = schema;
    this.logger = options.logger ?? new NoopLogger();
    this.cache = options.cache ?? new NoopCache();
  }
  static [entityKind] = "BetterSQLiteSession";
  logger;
  cache;
  prepareQuery(query, fields, executeMethod, isResponseInArrayMode, customResultMapper, queryMetadata, cacheConfig) {
    const stmt = this.client.prepare(query.sql);
    return new PreparedQuery(
      stmt,
      query,
      this.logger,
      this.cache,
      queryMetadata,
      cacheConfig,
      fields,
      executeMethod,
      isResponseInArrayMode,
      customResultMapper
    );
  }
  transaction(transaction, config = {}) {
    const tx = new BetterSQLiteTransaction("sync", this.dialect, this, this.schema);
    const nativeTx = this.client.transaction(transaction);
    return nativeTx[config.behavior ?? "deferred"](tx);
  }
};
var BetterSQLiteTransaction = class _BetterSQLiteTransaction extends SQLiteTransaction {
  static {
    __name(this, "BetterSQLiteTransaction");
  }
  static [entityKind] = "BetterSQLiteTransaction";
  transaction(transaction) {
    const savepointName = `sp${this.nestedIndex}`;
    const tx = new _BetterSQLiteTransaction("sync", this.dialect, this.session, this.schema, this.nestedIndex + 1);
    this.session.run(sql.raw(`savepoint ${savepointName}`));
    try {
      const result = transaction(tx);
      this.session.run(sql.raw(`release savepoint ${savepointName}`));
      return result;
    } catch (err) {
      this.session.run(sql.raw(`rollback to savepoint ${savepointName}`));
      throw err;
    }
  }
};
var PreparedQuery = class extends SQLitePreparedQuery {
  static {
    __name(this, "PreparedQuery");
  }
  constructor(stmt, query, logger2, cache2, queryMetadata, cacheConfig, fields, executeMethod, _isResponseInArrayMode, customResultMapper) {
    super("sync", executeMethod, query, cache2, queryMetadata, cacheConfig);
    this.stmt = stmt;
    this.logger = logger2;
    this.fields = fields;
    this._isResponseInArrayMode = _isResponseInArrayMode;
    this.customResultMapper = customResultMapper;
  }
  static [entityKind] = "BetterSQLitePreparedQuery";
  run(placeholderValues) {
    const params = fillPlaceholders(this.query.params, placeholderValues ?? {});
    this.logger.logQuery(this.query.sql, params);
    return this.stmt.run(...params);
  }
  all(placeholderValues) {
    const { fields, joinsNotNullableMap, query, logger: logger2, stmt, customResultMapper } = this;
    if (!fields && !customResultMapper) {
      const params = fillPlaceholders(query.params, placeholderValues ?? {});
      logger2.logQuery(query.sql, params);
      return stmt.all(...params);
    }
    const rows = this.values(placeholderValues);
    if (customResultMapper) {
      return customResultMapper(rows);
    }
    return rows.map((row) => mapResultRow(fields, row, joinsNotNullableMap));
  }
  get(placeholderValues) {
    const params = fillPlaceholders(this.query.params, placeholderValues ?? {});
    this.logger.logQuery(this.query.sql, params);
    const { fields, stmt, joinsNotNullableMap, customResultMapper } = this;
    if (!fields && !customResultMapper) {
      return stmt.get(...params);
    }
    const row = stmt.raw().get(...params);
    if (!row) {
      return void 0;
    }
    if (customResultMapper) {
      return customResultMapper([row]);
    }
    return mapResultRow(fields, row, joinsNotNullableMap);
  }
  values(placeholderValues) {
    const params = fillPlaceholders(this.query.params, placeholderValues ?? {});
    this.logger.logQuery(this.query.sql, params);
    return this.stmt.raw().all(...params);
  }
  /** @internal */
  isResponseInArrayMode() {
    return this._isResponseInArrayMode;
  }
};

// node_modules/.pnpm/drizzle-orm@0.45.1_@libsql+client@0.17.0_@types+better-sqlite3@7.6.13_better-sqlite3@12.6.2/node_modules/drizzle-orm/better-sqlite3/driver.js
var BetterSQLite3Database = class extends BaseSQLiteDatabase {
  static {
    __name(this, "BetterSQLite3Database");
  }
  static [entityKind] = "BetterSQLite3Database";
};
function construct(client, config = {}) {
  const dialect = new SQLiteSyncDialect({ casing: config.casing });
  let logger2;
  if (config.logger === true) {
    logger2 = new DefaultLogger();
  } else if (config.logger !== false) {
    logger2 = config.logger;
  }
  let schema;
  if (config.schema) {
    const tablesConfig = extractTablesRelationalConfig(
      config.schema,
      createTableRelationsHelpers
    );
    schema = {
      fullSchema: config.schema,
      schema: tablesConfig.tables,
      tableNamesMap: tablesConfig.tableNamesMap
    };
  }
  const session = new BetterSQLiteSession(client, dialect, schema, { logger: logger2 });
  const db2 = new BetterSQLite3Database("sync", dialect, session, schema);
  db2.$client = client;
  return db2;
}
__name(construct, "construct");
function drizzle(...params) {
  if (params[0] === void 0 || typeof params[0] === "string") {
    const instance = params[0] === void 0 ? new Client() : new Client(params[0]);
    return construct(instance, params[1]);
  }
  if (isConfig(params[0])) {
    const { connection, client, ...drizzleConfig } = params[0];
    if (client) return construct(client, drizzleConfig);
    if (typeof connection === "object") {
      const { source, ...options } = connection;
      const instance2 = new Client(source, options);
      return construct(instance2, drizzleConfig);
    }
    const instance = new Client(connection);
    return construct(instance, drizzleConfig);
  }
  return construct(params[0], params[1]);
}
__name(drizzle, "drizzle");
((drizzle22) => {
  function mock(config) {
    return construct({}, config);
  }
  __name(mock, "mock");
  drizzle22.mock = mock;
})(drizzle || (drizzle = {}));

// node_modules/.pnpm/drizzle-orm@0.45.1_@libsql+client@0.17.0_@types+better-sqlite3@7.6.13_better-sqlite3@12.6.2/node_modules/drizzle-orm/libsql/driver.js
import { createClient } from "@libsql/client";

// node_modules/.pnpm/drizzle-orm@0.45.1_@libsql+client@0.17.0_@types+better-sqlite3@7.6.13_better-sqlite3@12.6.2/node_modules/drizzle-orm/libsql/session.js
var LibSQLSession = class _LibSQLSession extends SQLiteSession {
  static {
    __name(this, "LibSQLSession");
  }
  constructor(client, dialect, schema, options, tx) {
    super(dialect);
    this.client = client;
    this.schema = schema;
    this.options = options;
    this.tx = tx;
    this.logger = options.logger ?? new NoopLogger();
    this.cache = options.cache ?? new NoopCache();
  }
  static [entityKind] = "LibSQLSession";
  logger;
  cache;
  prepareQuery(query, fields, executeMethod, isResponseInArrayMode, customResultMapper, queryMetadata, cacheConfig) {
    return new LibSQLPreparedQuery(
      this.client,
      query,
      this.logger,
      this.cache,
      queryMetadata,
      cacheConfig,
      fields,
      this.tx,
      executeMethod,
      isResponseInArrayMode,
      customResultMapper
    );
  }
  async batch(queries) {
    const preparedQueries = [];
    const builtQueries = [];
    for (const query of queries) {
      const preparedQuery = query._prepare();
      const builtQuery = preparedQuery.getQuery();
      preparedQueries.push(preparedQuery);
      builtQueries.push({ sql: builtQuery.sql, args: builtQuery.params });
    }
    const batchResults = await this.client.batch(builtQueries);
    return batchResults.map((result, i) => preparedQueries[i].mapResult(result, true));
  }
  async migrate(queries) {
    const preparedQueries = [];
    const builtQueries = [];
    for (const query of queries) {
      const preparedQuery = query._prepare();
      const builtQuery = preparedQuery.getQuery();
      preparedQueries.push(preparedQuery);
      builtQueries.push({ sql: builtQuery.sql, args: builtQuery.params });
    }
    const batchResults = await this.client.migrate(builtQueries);
    return batchResults.map((result, i) => preparedQueries[i].mapResult(result, true));
  }
  async transaction(transaction, _config) {
    const libsqlTx = await this.client.transaction();
    const session = new _LibSQLSession(
      this.client,
      this.dialect,
      this.schema,
      this.options,
      libsqlTx
    );
    const tx = new LibSQLTransaction("async", this.dialect, session, this.schema);
    try {
      const result = await transaction(tx);
      await libsqlTx.commit();
      return result;
    } catch (err) {
      await libsqlTx.rollback();
      throw err;
    }
  }
  extractRawAllValueFromBatchResult(result) {
    return result.rows;
  }
  extractRawGetValueFromBatchResult(result) {
    return result.rows[0];
  }
  extractRawValuesValueFromBatchResult(result) {
    return result.rows;
  }
};
var LibSQLTransaction = class _LibSQLTransaction extends SQLiteTransaction {
  static {
    __name(this, "LibSQLTransaction");
  }
  static [entityKind] = "LibSQLTransaction";
  async transaction(transaction) {
    const savepointName = `sp${this.nestedIndex}`;
    const tx = new _LibSQLTransaction("async", this.dialect, this.session, this.schema, this.nestedIndex + 1);
    await this.session.run(sql.raw(`savepoint ${savepointName}`));
    try {
      const result = await transaction(tx);
      await this.session.run(sql.raw(`release savepoint ${savepointName}`));
      return result;
    } catch (err) {
      await this.session.run(sql.raw(`rollback to savepoint ${savepointName}`));
      throw err;
    }
  }
};
var LibSQLPreparedQuery = class extends SQLitePreparedQuery {
  static {
    __name(this, "LibSQLPreparedQuery");
  }
  constructor(client, query, logger2, cache2, queryMetadata, cacheConfig, fields, tx, executeMethod, _isResponseInArrayMode, customResultMapper) {
    super("async", executeMethod, query, cache2, queryMetadata, cacheConfig);
    this.client = client;
    this.logger = logger2;
    this.fields = fields;
    this.tx = tx;
    this._isResponseInArrayMode = _isResponseInArrayMode;
    this.customResultMapper = customResultMapper;
    this.customResultMapper = customResultMapper;
    this.fields = fields;
  }
  static [entityKind] = "LibSQLPreparedQuery";
  async run(placeholderValues) {
    const params = fillPlaceholders(this.query.params, placeholderValues ?? {});
    this.logger.logQuery(this.query.sql, params);
    return await this.queryWithCache(this.query.sql, params, async () => {
      const stmt = { sql: this.query.sql, args: params };
      return this.tx ? this.tx.execute(stmt) : this.client.execute(stmt);
    });
  }
  async all(placeholderValues) {
    const { fields, logger: logger2, query, tx, client, customResultMapper } = this;
    if (!fields && !customResultMapper) {
      const params = fillPlaceholders(query.params, placeholderValues ?? {});
      logger2.logQuery(query.sql, params);
      return await this.queryWithCache(query.sql, params, async () => {
        const stmt = { sql: query.sql, args: params };
        return (tx ? tx.execute(stmt) : client.execute(stmt)).then(({ rows: rows2 }) => this.mapAllResult(rows2));
      });
    }
    const rows = await this.values(placeholderValues);
    return this.mapAllResult(rows);
  }
  mapAllResult(rows, isFromBatch) {
    if (isFromBatch) {
      rows = rows.rows;
    }
    if (!this.fields && !this.customResultMapper) {
      return rows.map((row) => normalizeRow(row));
    }
    if (this.customResultMapper) {
      return this.customResultMapper(rows, normalizeFieldValue);
    }
    return rows.map((row) => {
      return mapResultRow(
        this.fields,
        Array.prototype.slice.call(row).map((v2) => normalizeFieldValue(v2)),
        this.joinsNotNullableMap
      );
    });
  }
  async get(placeholderValues) {
    const { fields, logger: logger2, query, tx, client, customResultMapper } = this;
    if (!fields && !customResultMapper) {
      const params = fillPlaceholders(query.params, placeholderValues ?? {});
      logger2.logQuery(query.sql, params);
      return await this.queryWithCache(query.sql, params, async () => {
        const stmt = { sql: query.sql, args: params };
        return (tx ? tx.execute(stmt) : client.execute(stmt)).then(({ rows: rows2 }) => this.mapGetResult(rows2));
      });
    }
    const rows = await this.values(placeholderValues);
    return this.mapGetResult(rows);
  }
  mapGetResult(rows, isFromBatch) {
    if (isFromBatch) {
      rows = rows.rows;
    }
    const row = rows[0];
    if (!this.fields && !this.customResultMapper) {
      return normalizeRow(row);
    }
    if (!row) {
      return void 0;
    }
    if (this.customResultMapper) {
      return this.customResultMapper(rows, normalizeFieldValue);
    }
    return mapResultRow(
      this.fields,
      Array.prototype.slice.call(row).map((v2) => normalizeFieldValue(v2)),
      this.joinsNotNullableMap
    );
  }
  async values(placeholderValues) {
    const params = fillPlaceholders(this.query.params, placeholderValues ?? {});
    this.logger.logQuery(this.query.sql, params);
    return await this.queryWithCache(this.query.sql, params, async () => {
      const stmt = { sql: this.query.sql, args: params };
      return (this.tx ? this.tx.execute(stmt) : this.client.execute(stmt)).then(({ rows }) => rows);
    });
  }
  /** @internal */
  isResponseInArrayMode() {
    return this._isResponseInArrayMode;
  }
};
function normalizeRow(obj) {
  return Object.keys(obj).reduce((acc, key) => {
    if (Object.prototype.propertyIsEnumerable.call(obj, key)) {
      acc[key] = obj[key];
    }
    return acc;
  }, {});
}
__name(normalizeRow, "normalizeRow");
function normalizeFieldValue(value) {
  if (typeof ArrayBuffer !== "undefined" && value instanceof ArrayBuffer) {
    if (typeof Buffer !== "undefined") {
      if (!(value instanceof Buffer)) {
        return Buffer.from(value);
      }
      return value;
    }
    if (typeof TextDecoder !== "undefined") {
      return new TextDecoder().decode(value);
    }
    throw new Error("TextDecoder is not available. Please provide either Buffer or TextDecoder polyfill.");
  }
  return value;
}
__name(normalizeFieldValue, "normalizeFieldValue");

// node_modules/.pnpm/drizzle-orm@0.45.1_@libsql+client@0.17.0_@types+better-sqlite3@7.6.13_better-sqlite3@12.6.2/node_modules/drizzle-orm/libsql/driver-core.js
var LibSQLDatabase = class extends BaseSQLiteDatabase {
  static {
    __name(this, "LibSQLDatabase");
  }
  static [entityKind] = "LibSQLDatabase";
  async batch(batch) {
    return this.session.batch(batch);
  }
};
function construct2(client, config = {}) {
  const dialect = new SQLiteAsyncDialect({ casing: config.casing });
  let logger2;
  if (config.logger === true) {
    logger2 = new DefaultLogger();
  } else if (config.logger !== false) {
    logger2 = config.logger;
  }
  let schema;
  if (config.schema) {
    const tablesConfig = extractTablesRelationalConfig(
      config.schema,
      createTableRelationsHelpers
    );
    schema = {
      fullSchema: config.schema,
      schema: tablesConfig.tables,
      tableNamesMap: tablesConfig.tableNamesMap
    };
  }
  const session = new LibSQLSession(client, dialect, schema, { logger: logger2, cache: config.cache }, void 0);
  const db2 = new LibSQLDatabase("async", dialect, session, schema);
  db2.$client = client;
  db2.$cache = config.cache;
  if (db2.$cache) {
    db2.$cache["invalidate"] = config.cache?.onMutate;
  }
  return db2;
}
__name(construct2, "construct");

// node_modules/.pnpm/drizzle-orm@0.45.1_@libsql+client@0.17.0_@types+better-sqlite3@7.6.13_better-sqlite3@12.6.2/node_modules/drizzle-orm/libsql/driver.js
function drizzle2(...params) {
  if (typeof params[0] === "string") {
    const instance = createClient({
      url: params[0]
    });
    return construct2(instance, params[1]);
  }
  if (isConfig(params[0])) {
    const { connection, client, ...drizzleConfig } = params[0];
    if (client) return construct2(client, drizzleConfig);
    const instance = typeof connection === "string" ? createClient({ url: connection }) : createClient(connection);
    return construct2(instance, drizzleConfig);
  }
  return construct2(params[0], params[1]);
}
__name(drizzle2, "drizzle");
((drizzle22) => {
  function mock(config) {
    return construct2({}, config);
  }
  __name(mock, "mock");
  drizzle22.mock = mock;
})(drizzle2 || (drizzle2 = {}));

// packages/db/src/client.ts
var isTurso = !!(process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN);
var db;
var sqlite = null;
if (isTurso) {
  const { createClient: createClient2 } = await import("@libsql/client");
  const client = createClient2({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN
  });
  db = drizzle2(client, { schema: schema_exports });
  console.log("Connected to Turso database");
} else {
  const { default: Database } = await import("better-sqlite3");
  const { existsSync, mkdirSync } = await import("fs");
  const { dirname } = await import("path");
  const dbPath = process.env.DATABASE_URL?.replace("file:", "") || "./data/skillomatic.db";
  const dir = dirname(dbPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  sqlite = new Database(dbPath);
  sqlite.pragma("journal_mode = WAL");
  db = drizzle(sqlite, { schema: schema_exports });
  console.log(`Connected to local SQLite database: ${dbPath}`);
}

// node_modules/.pnpm/bcrypt-ts@8.0.0/node_modules/bcrypt-ts/dist/node.js
var E = process.env.NEXT_RUNTIME === "edge" ? setTimeout : setImmediate;
var w = 16;
var $ = 10;
var U = 16;
var j = 100;
var y = "./ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789".split("");
var p = [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 0, 1, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, -1, -1, -1, -1, -1, -1, -1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, -1, -1, -1, -1, -1, -1, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, -1, -1, -1, -1, -1];
var v = [608135816, 2242054355, 320440878, 57701188, 2752067618, 698298832, 137296536, 3964562569, 1160258022, 953160567, 3193202383, 887688300, 3232508343, 3380367581, 1065670069, 3041331479, 2450970073, 2306472731];
var B = [3509652390, 2564797868, 805139163, 3491422135, 3101798381, 1780907670, 3128725573, 4046225305, 614570311, 3012652279, 134345442, 2240740374, 1667834072, 1901547113, 2757295779, 4103290238, 227898511, 1921955416, 1904987480, 2182433518, 2069144605, 3260701109, 2620446009, 720527379, 3318853667, 677414384, 3393288472, 3101374703, 2390351024, 1614419982, 1822297739, 2954791486, 3608508353, 3174124327, 2024746970, 1432378464, 3864339955, 2857741204, 1464375394, 1676153920, 1439316330, 715854006, 3033291828, 289532110, 2706671279, 2087905683, 3018724369, 1668267050, 732546397, 1947742710, 3462151702, 2609353502, 2950085171, 1814351708, 2050118529, 680887927, 999245976, 1800124847, 3300911131, 1713906067, 1641548236, 4213287313, 1216130144, 1575780402, 4018429277, 3917837745, 3693486850, 3949271944, 596196993, 3549867205, 258830323, 2213823033, 772490370, 2760122372, 1774776394, 2652871518, 566650946, 4142492826, 1728879713, 2882767088, 1783734482, 3629395816, 2517608232, 2874225571, 1861159788, 326777828, 3124490320, 2130389656, 2716951837, 967770486, 1724537150, 2185432712, 2364442137, 1164943284, 2105845187, 998989502, 3765401048, 2244026483, 1075463327, 1455516326, 1322494562, 910128902, 469688178, 1117454909, 936433444, 3490320968, 3675253459, 1240580251, 122909385, 2157517691, 634681816, 4142456567, 3825094682, 3061402683, 2540495037, 79693498, 3249098678, 1084186820, 1583128258, 426386531, 1761308591, 1047286709, 322548459, 995290223, 1845252383, 2603652396, 3431023940, 2942221577, 3202600964, 3727903485, 1712269319, 422464435, 3234572375, 1170764815, 3523960633, 3117677531, 1434042557, 442511882, 3600875718, 1076654713, 1738483198, 4213154764, 2393238008, 3677496056, 1014306527, 4251020053, 793779912, 2902807211, 842905082, 4246964064, 1395751752, 1040244610, 2656851899, 3396308128, 445077038, 3742853595, 3577915638, 679411651, 2892444358, 2354009459, 1767581616, 3150600392, 3791627101, 3102740896, 284835224, 4246832056, 1258075500, 768725851, 2589189241, 3069724005, 3532540348, 1274779536, 3789419226, 2764799539, 1660621633, 3471099624, 4011903706, 913787905, 3497959166, 737222580, 2514213453, 2928710040, 3937242737, 1804850592, 3499020752, 2949064160, 2386320175, 2390070455, 2415321851, 4061277028, 2290661394, 2416832540, 1336762016, 1754252060, 3520065937, 3014181293, 791618072, 3188594551, 3933548030, 2332172193, 3852520463, 3043980520, 413987798, 3465142937, 3030929376, 4245938359, 2093235073, 3534596313, 375366246, 2157278981, 2479649556, 555357303, 3870105701, 2008414854, 3344188149, 4221384143, 3956125452, 2067696032, 3594591187, 2921233993, 2428461, 544322398, 577241275, 1471733935, 610547355, 4027169054, 1432588573, 1507829418, 2025931657, 3646575487, 545086370, 48609733, 2200306550, 1653985193, 298326376, 1316178497, 3007786442, 2064951626, 458293330, 2589141269, 3591329599, 3164325604, 727753846, 2179363840, 146436021, 1461446943, 4069977195, 705550613, 3059967265, 3887724982, 4281599278, 3313849956, 1404054877, 2845806497, 146425753, 1854211946, 1266315497, 3048417604, 3681880366, 3289982499, 290971e4, 1235738493, 2632868024, 2414719590, 3970600049, 1771706367, 1449415276, 3266420449, 422970021, 1963543593, 2690192192, 3826793022, 1062508698, 1531092325, 1804592342, 2583117782, 2714934279, 4024971509, 1294809318, 4028980673, 1289560198, 2221992742, 1669523910, 35572830, 157838143, 1052438473, 1016535060, 1802137761, 1753167236, 1386275462, 3080475397, 2857371447, 1040679964, 2145300060, 2390574316, 1461121720, 2956646967, 4031777805, 4028374788, 33600511, 2920084762, 1018524850, 629373528, 3691585981, 3515945977, 2091462646, 2486323059, 586499841, 988145025, 935516892, 3367335476, 2599673255, 2839830854, 265290510, 3972581182, 2759138881, 3795373465, 1005194799, 847297441, 406762289, 1314163512, 1332590856, 1866599683, 4127851711, 750260880, 613907577, 1450815602, 3165620655, 3734664991, 3650291728, 3012275730, 3704569646, 1427272223, 778793252, 1343938022, 2676280711, 2052605720, 1946737175, 3164576444, 3914038668, 3967478842, 3682934266, 1661551462, 3294938066, 4011595847, 840292616, 3712170807, 616741398, 312560963, 711312465, 1351876610, 322626781, 1910503582, 271666773, 2175563734, 1594956187, 70604529, 3617834859, 1007753275, 1495573769, 4069517037, 2549218298, 2663038764, 504708206, 2263041392, 3941167025, 2249088522, 1514023603, 1998579484, 1312622330, 694541497, 2582060303, 2151582166, 1382467621, 776784248, 2618340202, 3323268794, 2497899128, 2784771155, 503983604, 4076293799, 907881277, 423175695, 432175456, 1378068232, 4145222326, 3954048622, 3938656102, 3820766613, 2793130115, 2977904593, 26017576, 3274890735, 3194772133, 1700274565, 1756076034, 4006520079, 3677328699, 720338349, 1533947780, 354530856, 688349552, 3973924725, 1637815568, 332179504, 3949051286, 53804574, 2852348879, 3044236432, 1282449977, 3583942155, 3416972820, 4006381244, 1617046695, 2628476075, 3002303598, 1686838959, 431878346, 2686675385, 1700445008, 1080580658, 1009431731, 832498133, 3223435511, 2605976345, 2271191193, 2516031870, 1648197032, 4164389018, 2548247927, 300782431, 375919233, 238389289, 3353747414, 2531188641, 2019080857, 1475708069, 455242339, 2609103871, 448939670, 3451063019, 1395535956, 2413381860, 1841049896, 1491858159, 885456874, 4264095073, 4001119347, 1565136089, 3898914787, 1108368660, 540939232, 1173283510, 2745871338, 3681308437, 4207628240, 3343053890, 4016749493, 1699691293, 1103962373, 3625875870, 2256883143, 3830138730, 1031889488, 3479347698, 1535977030, 4236805024, 3251091107, 2132092099, 1774941330, 1199868427, 1452454533, 157007616, 2904115357, 342012276, 595725824, 1480756522, 206960106, 497939518, 591360097, 863170706, 2375253569, 3596610801, 1814182875, 2094937945, 3421402208, 1082520231, 3463918190, 2785509508, 435703966, 3908032597, 1641649973, 2842273706, 3305899714, 1510255612, 2148256476, 2655287854, 3276092548, 4258621189, 236887753, 3681803219, 274041037, 1734335097, 3815195456, 3317970021, 1899903192, 1026095262, 4050517792, 356393447, 2410691914, 3873677099, 3682840055, 3913112168, 2491498743, 4132185628, 2489919796, 1091903735, 1979897079, 3170134830, 3567386728, 3557303409, 857797738, 1136121015, 1342202287, 507115054, 2535736646, 337727348, 3213592640, 1301675037, 2528481711, 1895095763, 1721773893, 3216771564, 62756741, 2142006736, 835421444, 2531993523, 1442658625, 3659876326, 2882144922, 676362277, 1392781812, 170690266, 3921047035, 1759253602, 3611846912, 1745797284, 664899054, 1329594018, 3901205900, 3045908486, 2062866102, 2865634940, 3543621612, 3464012697, 1080764994, 553557557, 3656615353, 3996768171, 991055499, 499776247, 1265440854, 648242737, 3940784050, 980351604, 3713745714, 1749149687, 3396870395, 4211799374, 3640570775, 1161844396, 3125318951, 1431517754, 545492359, 4268468663, 3499529547, 1437099964, 2702547544, 3433638243, 2581715763, 2787789398, 1060185593, 1593081372, 2418618748, 4260947970, 69676912, 2159744348, 86519011, 2512459080, 3838209314, 1220612927, 3339683548, 133810670, 1090789135, 1078426020, 1569222167, 845107691, 3583754449, 4072456591, 1091646820, 628848692, 1613405280, 3757631651, 526609435, 236106946, 48312990, 2942717905, 3402727701, 1797494240, 859738849, 992217954, 4005476642, 2243076622, 3870952857, 3732016268, 765654824, 3490871365, 2511836413, 1685915746, 3888969200, 1414112111, 2273134842, 3281911079, 4080962846, 172450625, 2569994100, 980381355, 4109958455, 2819808352, 2716589560, 2568741196, 3681446669, 3329971472, 1835478071, 660984891, 3704678404, 4045999559, 3422617507, 3040415634, 1762651403, 1719377915, 3470491036, 2693910283, 3642056355, 3138596744, 1364962596, 2073328063, 1983633131, 926494387, 3423689081, 2150032023, 4096667949, 1749200295, 3328846651, 309677260, 2016342300, 1779581495, 3079819751, 111262694, 1274766160, 443224088, 298511866, 1025883608, 3806446537, 1145181785, 168956806, 3641502830, 3584813610, 1689216846, 3666258015, 3200248200, 1692713982, 2646376535, 4042768518, 1618508792, 1610833997, 3523052358, 4130873264, 2001055236, 3610705100, 2202168115, 4028541809, 2961195399, 1006657119, 2006996926, 3186142756, 1430667929, 3210227297, 1314452623, 4074634658, 4101304120, 2273951170, 1399257539, 3367210612, 3027628629, 1190975929, 2062231137, 2333990788, 2221543033, 2438960610, 1181637006, 548689776, 2362791313, 3372408396, 3104550113, 3145860560, 296247880, 1970579870, 3078560182, 3769228297, 1714227617, 3291629107, 3898220290, 166772364, 1251581989, 493813264, 448347421, 195405023, 2709975567, 677966185, 3703036547, 1463355134, 2715995803, 1338867538, 1343315457, 2802222074, 2684532164, 233230375, 2599980071, 2000651841, 3277868038, 1638401717, 4028070440, 3237316320, 6314154, 819756386, 300326615, 590932579, 1405279636, 3267499572, 3150704214, 2428286686, 3959192993, 3461946742, 1862657033, 1266418056, 963775037, 2089974820, 2263052895, 1917689273, 448879540, 3550394620, 3981727096, 150775221, 3627908307, 1303187396, 508620638, 2975983352, 2726630617, 1817252668, 1876281319, 1457606340, 908771278, 3720792119, 3617206836, 2455994898, 1729034894, 1080033504, 976866871, 3556439503, 2881648439, 1522871579, 1555064734, 1336096578, 3548522304, 2579274686, 3574697629, 3205460757, 3593280638, 3338716283, 3079412587, 564236357, 2993598910, 1781952180, 1464380207, 3163844217, 3332601554, 1699332808, 1393555694, 1183702653, 3581086237, 1288719814, 691649499, 2847557200, 2895455976, 3193889540, 2717570544, 1781354906, 1676643554, 2592534050, 3230253752, 1126444790, 2770207658, 2633158820, 2210423226, 2615765581, 2414155088, 3127139286, 673620729, 2805611233, 1269405062, 4015350505, 3341807571, 4149409754, 1057255273, 2012875353, 2162469141, 2276492801, 2601117357, 993977747, 3918593370, 2654263191, 753973209, 36408145, 2530585658, 25011837, 3520020182, 2088578344, 530523599, 2918365339, 1524020338, 1518925132, 3760827505, 3759777254, 1202760957, 3985898139, 3906192525, 674977740, 4174734889, 2031300136, 2019492241, 3983892565, 4153806404, 3822280332, 352677332, 2297720250, 60907813, 90501309, 3286998549, 1016092578, 2535922412, 2839152426, 457141659, 509813237, 4120667899, 652014361, 1966332200, 2975202805, 55981186, 2327461051, 676427537, 3255491064, 2882294119, 3433927263, 1307055953, 942726286, 933058658, 2468411793, 3933900994, 4215176142, 1361170020, 2001714738, 2830558078, 3274259782, 1222529897, 1679025792, 2729314320, 3714953764, 1770335741, 151462246, 3013232138, 1682292957, 1483529935, 471910574, 1539241949, 458788160, 3436315007, 1807016891, 3718408830, 978976581, 1043663428, 3165965781, 1927990952, 4200891579, 2372276910, 3208408903, 3533431907, 1412390302, 2931980059, 4132332400, 1947078029, 3881505623, 4168226417, 2941484381, 1077988104, 1320477388, 886195818, 18198404, 3786409e3, 2509781533, 112762804, 3463356488, 1866414978, 891333506, 18488651, 661792760, 1628790961, 3885187036, 3141171499, 876946877, 2693282273, 1372485963, 791857591, 2686433993, 3759982718, 3167212022, 3472953795, 2716379847, 445679433, 3561995674, 3504004811, 3574258232, 54117162, 3331405415, 2381918588, 3769707343, 4154350007, 1140177722, 4074052095, 668550556, 3214352940, 367459370, 261225585, 2610173221, 4209349473, 3468074219, 3265815641, 314222801, 3066103646, 3808782860, 282218597, 3406013506, 3773591054, 379116347, 1285071038, 846784868, 2669647154, 3771962079, 3550491691, 2305946142, 453669953, 1268987020, 3317592352, 3279303384, 3744833421, 2610507566, 3859509063, 266596637, 3847019092, 517658769, 3462560207, 3443424879, 370717030, 4247526661, 2224018117, 4143653529, 4112773975, 2788324899, 2477274417, 1456262402, 2901442914, 1517677493, 1846949527, 2295493580, 3734397586, 2176403920, 1280348187, 1908823572, 3871786941, 846861322, 1172426758, 3287448474, 3383383037, 1655181056, 3139813346, 901632758, 1897031941, 2986607138, 3066810236, 3447102507, 1393639104, 373351379, 950779232, 625454576, 3124240540, 4148612726, 2007998917, 544563296, 2244738638, 2330496472, 2058025392, 1291430526, 424198748, 50039436, 29584100, 3605783033, 2429876329, 2791104160, 1057563949, 3255363231, 3075367218, 3463963227, 1469046755, 985887462];
var S = [1332899944, 1700884034, 1701343084, 1684370003, 1668446532, 1869963892];
var C = /* @__PURE__ */ __name((o, n) => {
  if (n <= 0 || n > o.length) throw Error(`Illegal length: ${n}`);
  let e = 0, r, t;
  const s = [];
  for (; e < n; ) {
    if (r = o[e++] & 255, s.push(y[r >> 2 & 63]), r = (r & 3) << 4, e >= n) {
      s.push(y[r & 63]);
      break;
    }
    if (t = o[e++] & 255, r |= t >> 4 & 15, s.push(y[r & 63]), r = (t & 15) << 2, e >= n) {
      s.push(y[r & 63]);
      break;
    }
    t = o[e++] & 255, r |= t >> 6 & 3, s.push(y[r & 63]), s.push(y[t & 63]);
  }
  return s.join("");
}, "C");
var x = /* @__PURE__ */ __name((o, n) => {
  const e = o.length;
  let r = 0, t = 0, s, l, h, f, c, i;
  const u = [];
  for (; r < e - 1 && t < n && (i = o.charCodeAt(r++), s = i < p.length ? p[i] : -1, i = o.charCodeAt(r++), l = i < p.length ? p[i] : -1, !(s === -1 || l === -1 || (c = s << 2 >>> 0, c |= (l & 48) >> 4, u.push(String.fromCharCode(c)), ++t >= n || r >= e) || (i = o.charCodeAt(r++), h = i < p.length ? p[i] : -1, h === -1) || (c = (l & 15) << 4 >>> 0, c |= (h & 60) >> 2, u.push(String.fromCharCode(c)), ++t >= n || r >= e))); ) i = o.charCodeAt(r++), f = i < p.length ? p[i] : -1, c = (h & 3) << 6 >>> 0, c |= f, u.push(String.fromCharCode(c)), ++t;
  return u.map((a) => a.charCodeAt(0));
}, "x");
var A = /* @__PURE__ */ __name((o, n, e, r) => {
  let t, s = o[n], l = o[n + 1];
  return s ^= e[0], t = r[s >>> 24], t += r[256 | s >> 16 & 255], t ^= r[512 | s >> 8 & 255], t += r[768 | s & 255], l ^= t ^ e[1], t = r[l >>> 24], t += r[256 | l >> 16 & 255], t ^= r[512 | l >> 8 & 255], t += r[768 | l & 255], s ^= t ^ e[2], t = r[s >>> 24], t += r[256 | s >> 16 & 255], t ^= r[512 | s >> 8 & 255], t += r[768 | s & 255], l ^= t ^ e[3], t = r[l >>> 24], t += r[256 | l >> 16 & 255], t ^= r[512 | l >> 8 & 255], t += r[768 | l & 255], s ^= t ^ e[4], t = r[s >>> 24], t += r[256 | s >> 16 & 255], t ^= r[512 | s >> 8 & 255], t += r[768 | s & 255], l ^= t ^ e[5], t = r[l >>> 24], t += r[256 | l >> 16 & 255], t ^= r[512 | l >> 8 & 255], t += r[768 | l & 255], s ^= t ^ e[6], t = r[s >>> 24], t += r[256 | s >> 16 & 255], t ^= r[512 | s >> 8 & 255], t += r[768 | s & 255], l ^= t ^ e[7], t = r[l >>> 24], t += r[256 | l >> 16 & 255], t ^= r[512 | l >> 8 & 255], t += r[768 | l & 255], s ^= t ^ e[8], t = r[s >>> 24], t += r[256 | s >> 16 & 255], t ^= r[512 | s >> 8 & 255], t += r[768 | s & 255], l ^= t ^ e[9], t = r[l >>> 24], t += r[256 | l >> 16 & 255], t ^= r[512 | l >> 8 & 255], t += r[768 | l & 255], s ^= t ^ e[10], t = r[s >>> 24], t += r[256 | s >> 16 & 255], t ^= r[512 | s >> 8 & 255], t += r[768 | s & 255], l ^= t ^ e[11], t = r[l >>> 24], t += r[256 | l >> 16 & 255], t ^= r[512 | l >> 8 & 255], t += r[768 | l & 255], s ^= t ^ e[12], t = r[s >>> 24], t += r[256 | s >> 16 & 255], t ^= r[512 | s >> 8 & 255], t += r[768 | s & 255], l ^= t ^ e[13], t = r[l >>> 24], t += r[256 | l >> 16 & 255], t ^= r[512 | l >> 8 & 255], t += r[768 | l & 255], s ^= t ^ e[14], t = r[s >>> 24], t += r[256 | s >> 16 & 255], t ^= r[512 | s >> 8 & 255], t += r[768 | s & 255], l ^= t ^ e[15], t = r[l >>> 24], t += r[256 | l >> 16 & 255], t ^= r[512 | l >> 8 & 255], t += r[768 | l & 255], s ^= t ^ e[16], o[n] = l ^ e[U + 1], o[n + 1] = s, o;
}, "A");
var m = /* @__PURE__ */ __name((o, n) => {
  let e = 0;
  for (let r = 0; r < 4; ++r) e = e << 8 | o[n] & 255, n = (n + 1) % o.length;
  return { key: e, offp: n };
}, "m");
var T = /* @__PURE__ */ __name((o, n, e) => {
  const r = n.length, t = e.length;
  let s = 0, l = new Int32Array([0, 0]), h;
  for (let f = 0; f < r; f++) h = m(o, s), s = h.offp, n[f] ^= h.key;
  for (let f = 0; f < r; f += 2) l = A(l, 0, n, e), n[f] = l[0], n[f + 1] = l[1];
  for (let f = 0; f < t; f += 2) l = A(l, 0, n, e), e[f] = l[0], e[f + 1] = l[1];
}, "T");
var D = /* @__PURE__ */ __name((o, n, e, r) => {
  const t = e.length, s = r.length;
  let l = 0, h = new Int32Array([0, 0]), f;
  for (let c = 0; c < t; c++) f = m(n, l), l = f.offp, e[c] ^= f.key;
  l = 0;
  for (let c = 0; c < t; c += 2) f = m(o, l), l = f.offp, h[0] ^= f.key, f = m(o, l), l = f.offp, h[1] ^= f.key, h = A(h, 0, e, r), e[c] = h[0], e[c + 1] = h[1];
  for (let c = 0; c < s; c += 2) f = m(o, l), l = f.offp, h[0] ^= f.key, f = m(o, l), l = f.offp, h[1] ^= f.key, h = A(h, 0, e, r), r[c] = h[0], r[c + 1] = h[1];
}, "D");
var _ = /* @__PURE__ */ __name((o, n, e, r, t) => {
  const s = new Int32Array(S), l = s.length;
  e = 1 << e >>> 0;
  const h = new Int32Array(v), f = new Int32Array(B);
  D(n, o, h, f);
  let c = 0;
  const i = /* @__PURE__ */ __name(() => {
    if (t && t(c / e), c < e) {
      const a = Date.now();
      for (; c < e && (c += 1, T(o, h, f), T(n, h, f), !(Date.now() - a > j)); ) ;
    } else {
      for (let g = 0; g < 64; g++) for (let I = 0; I < l >> 1; I++) A(s, I << 1, h, f);
      const a = [];
      for (let g = 0; g < l; g++) a.push(s[g] >> 24 & 255), a.push(s[g] >> 16 & 255), a.push(s[g] >> 8 & 255), a.push(s[g] & 255);
      return r ? a : Promise.resolve(a);
    }
    if (!r) return new Promise((a) => E(() => {
      i().then(a);
    }));
  }, "i");
  if (!r) return i();
  let u;
  do
    u = i();
  while (!u);
  return u;
}, "_");
var L = /* @__PURE__ */ __name((o) => globalThis.crypto.getRandomValues(new Uint8Array(o)), "L");
var d = /* @__PURE__ */ __name((...o) => new Error(`Illegal arguments: ${o.map((n) => typeof n).join(", ")}`), "d");
var b = /* @__PURE__ */ __name((o = $) => {
  if (typeof o != "number") throw d(o);
  return o = o < 4 ? 4 : o > 31 ? 31 : o, `$2b$${o < 10 ? "0" : ""}${o}$${C(L(w), w)}`;
}, "b");
var k = /* @__PURE__ */ __name((o) => {
  let n = 0, e = 0;
  for (let r = 0; r < o.length; ++r) e = o.charCodeAt(r), e < 128 ? n += 1 : e < 2048 ? n += 2 : (e & 64512) === 55296 && (o.charCodeAt(r + 1) & 64512) === 56320 ? (r++, n += 4) : n += 3;
  return n;
}, "k");
var G = /* @__PURE__ */ __name((o) => {
  let n = 0, e, r;
  const t = new Array(k(o));
  for (let s = 0, l = o.length; s < l; ++s) e = o.charCodeAt(s), e < 128 ? t[n++] = e : e < 2048 ? (t[n++] = e >> 6 | 192, t[n++] = e & 63 | 128) : (e & 64512) === 55296 && ((r = o.charCodeAt(s + 1)) & 64512) === 56320 ? (e = 65536 + ((e & 1023) << 10) + (r & 1023), ++s, t[n++] = e >> 18 | 240, t[n++] = e >> 12 & 63 | 128, t[n++] = e >> 6 & 63 | 128, t[n++] = e & 63 | 128) : (t[n++] = e >> 12 | 224, t[n++] = e >> 6 & 63 | 128, t[n++] = e & 63 | 128);
  return t;
}, "G");
var N = /* @__PURE__ */ __name((o, n, e, r) => {
  if (typeof o != "string" || typeof n != "string") {
    const a = new Error("Invalid content / salt: not a string");
    if (!e) return Promise.reject(a);
    throw a;
  }
  let t, s;
  if (n.charAt(0) !== "$" || n.charAt(1) !== "2") {
    const a = new Error("Invalid salt version: " + n.substring(0, 2));
    if (!e) return Promise.reject(a);
    throw a;
  }
  if (n.charAt(2) === "$") t = "\0", s = 3;
  else {
    if (t = n.charAt(2), t !== "a" && t !== "b" && t !== "y" || n.charAt(3) !== "$") {
      const a = Error("Invalid salt revision: " + n.substring(2, 4));
      if (!e) return Promise.reject(a);
      throw a;
    }
    s = 4;
  }
  const l = n.substring(s, s + 2), h = /\d\d/.test(l) ? Number(l) : null;
  if (h === null) {
    const a = new Error("Missing salt rounds");
    if (!e) return Promise.reject(a);
    throw a;
  }
  if (h < 4 || h > 31) {
    const a = new Error(`Illegal number of rounds (4-31): ${h}`);
    if (!e) return Promise.reject(a);
    throw a;
  }
  const f = n.substring(s + 3, s + 25);
  o += t >= "a" ? "\0" : "";
  const c = G(o), i = x(f, w);
  if (i.length !== w) {
    const a = new Error(`Illegal salt: ${f}`);
    if (!e) return Promise.reject(a);
    throw a;
  }
  const u = /* @__PURE__ */ __name((a) => `$2${t >= "a" ? t : ""}$${h < 10 ? "0" : ""}${h}$${C(i, w)}${C(a, S.length * 4 - 1)}`, "u");
  return e ? u(_(c, i, h, true, r)) : _(c, i, h, false, r).then((a) => u(a));
}, "N");
var R = /* @__PURE__ */ __name((o, n = $) => N(o, typeof n == "number" ? b(n) : n, true), "R");
var M = /* @__PURE__ */ __name((o, n) => {
  if (typeof o != "string" || typeof n != "string") throw d(o, n);
  return n.length !== 60 ? false : R(o, n.substring(0, 29)) === n;
}, "M");

// node_modules/.pnpm/jose@6.1.3/node_modules/jose/dist/webapi/lib/buffer_utils.js
var encoder = new TextEncoder();
var decoder = new TextDecoder();
var MAX_INT32 = 2 ** 32;
function concat(...buffers) {
  const size = buffers.reduce((acc, { length }) => acc + length, 0);
  const buf = new Uint8Array(size);
  let i = 0;
  for (const buffer of buffers) {
    buf.set(buffer, i);
    i += buffer.length;
  }
  return buf;
}
__name(concat, "concat");
function encode(string) {
  const bytes = new Uint8Array(string.length);
  for (let i = 0; i < string.length; i++) {
    const code = string.charCodeAt(i);
    if (code > 127) {
      throw new TypeError("non-ASCII string encountered in encode()");
    }
    bytes[i] = code;
  }
  return bytes;
}
__name(encode, "encode");

// node_modules/.pnpm/jose@6.1.3/node_modules/jose/dist/webapi/lib/base64.js
function encodeBase642(input) {
  if (Uint8Array.prototype.toBase64) {
    return input.toBase64();
  }
  const CHUNK_SIZE = 32768;
  const arr = [];
  for (let i = 0; i < input.length; i += CHUNK_SIZE) {
    arr.push(String.fromCharCode.apply(null, input.subarray(i, i + CHUNK_SIZE)));
  }
  return btoa(arr.join(""));
}
__name(encodeBase642, "encodeBase64");
function decodeBase642(encoded) {
  if (Uint8Array.fromBase64) {
    return Uint8Array.fromBase64(encoded);
  }
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
__name(decodeBase642, "decodeBase64");

// node_modules/.pnpm/jose@6.1.3/node_modules/jose/dist/webapi/util/base64url.js
function decode(input) {
  if (Uint8Array.fromBase64) {
    return Uint8Array.fromBase64(typeof input === "string" ? input : decoder.decode(input), {
      alphabet: "base64url"
    });
  }
  let encoded = input;
  if (encoded instanceof Uint8Array) {
    encoded = decoder.decode(encoded);
  }
  encoded = encoded.replace(/-/g, "+").replace(/_/g, "/");
  try {
    return decodeBase642(encoded);
  } catch {
    throw new TypeError("The input to be decoded is not correctly encoded.");
  }
}
__name(decode, "decode");
function encode2(input) {
  let unencoded = input;
  if (typeof unencoded === "string") {
    unencoded = encoder.encode(unencoded);
  }
  if (Uint8Array.prototype.toBase64) {
    return unencoded.toBase64({ alphabet: "base64url", omitPadding: true });
  }
  return encodeBase642(unencoded).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}
__name(encode2, "encode");

// node_modules/.pnpm/jose@6.1.3/node_modules/jose/dist/webapi/util/errors.js
var JOSEError = class extends Error {
  static {
    __name(this, "JOSEError");
  }
  static code = "ERR_JOSE_GENERIC";
  code = "ERR_JOSE_GENERIC";
  constructor(message2, options) {
    super(message2, options);
    this.name = this.constructor.name;
    Error.captureStackTrace?.(this, this.constructor);
  }
};
var JWTClaimValidationFailed = class extends JOSEError {
  static {
    __name(this, "JWTClaimValidationFailed");
  }
  static code = "ERR_JWT_CLAIM_VALIDATION_FAILED";
  code = "ERR_JWT_CLAIM_VALIDATION_FAILED";
  claim;
  reason;
  payload;
  constructor(message2, payload, claim = "unspecified", reason = "unspecified") {
    super(message2, { cause: { claim, reason, payload } });
    this.claim = claim;
    this.reason = reason;
    this.payload = payload;
  }
};
var JWTExpired = class extends JOSEError {
  static {
    __name(this, "JWTExpired");
  }
  static code = "ERR_JWT_EXPIRED";
  code = "ERR_JWT_EXPIRED";
  claim;
  reason;
  payload;
  constructor(message2, payload, claim = "unspecified", reason = "unspecified") {
    super(message2, { cause: { claim, reason, payload } });
    this.claim = claim;
    this.reason = reason;
    this.payload = payload;
  }
};
var JOSEAlgNotAllowed = class extends JOSEError {
  static {
    __name(this, "JOSEAlgNotAllowed");
  }
  static code = "ERR_JOSE_ALG_NOT_ALLOWED";
  code = "ERR_JOSE_ALG_NOT_ALLOWED";
};
var JOSENotSupported = class extends JOSEError {
  static {
    __name(this, "JOSENotSupported");
  }
  static code = "ERR_JOSE_NOT_SUPPORTED";
  code = "ERR_JOSE_NOT_SUPPORTED";
};
var JWSInvalid = class extends JOSEError {
  static {
    __name(this, "JWSInvalid");
  }
  static code = "ERR_JWS_INVALID";
  code = "ERR_JWS_INVALID";
};
var JWTInvalid = class extends JOSEError {
  static {
    __name(this, "JWTInvalid");
  }
  static code = "ERR_JWT_INVALID";
  code = "ERR_JWT_INVALID";
};
var JWSSignatureVerificationFailed = class extends JOSEError {
  static {
    __name(this, "JWSSignatureVerificationFailed");
  }
  static code = "ERR_JWS_SIGNATURE_VERIFICATION_FAILED";
  code = "ERR_JWS_SIGNATURE_VERIFICATION_FAILED";
  constructor(message2 = "signature verification failed", options) {
    super(message2, options);
  }
};

// node_modules/.pnpm/jose@6.1.3/node_modules/jose/dist/webapi/lib/crypto_key.js
var unusable = /* @__PURE__ */ __name((name, prop = "algorithm.name") => new TypeError(`CryptoKey does not support this operation, its ${prop} must be ${name}`), "unusable");
var isAlgorithm = /* @__PURE__ */ __name((algorithm, name) => algorithm.name === name, "isAlgorithm");
function getHashLength(hash) {
  return parseInt(hash.name.slice(4), 10);
}
__name(getHashLength, "getHashLength");
function getNamedCurve(alg) {
  switch (alg) {
    case "ES256":
      return "P-256";
    case "ES384":
      return "P-384";
    case "ES512":
      return "P-521";
    default:
      throw new Error("unreachable");
  }
}
__name(getNamedCurve, "getNamedCurve");
function checkUsage(key, usage) {
  if (usage && !key.usages.includes(usage)) {
    throw new TypeError(`CryptoKey does not support this operation, its usages must include ${usage}.`);
  }
}
__name(checkUsage, "checkUsage");
function checkSigCryptoKey(key, alg, usage) {
  switch (alg) {
    case "HS256":
    case "HS384":
    case "HS512": {
      if (!isAlgorithm(key.algorithm, "HMAC"))
        throw unusable("HMAC");
      const expected = parseInt(alg.slice(2), 10);
      const actual = getHashLength(key.algorithm.hash);
      if (actual !== expected)
        throw unusable(`SHA-${expected}`, "algorithm.hash");
      break;
    }
    case "RS256":
    case "RS384":
    case "RS512": {
      if (!isAlgorithm(key.algorithm, "RSASSA-PKCS1-v1_5"))
        throw unusable("RSASSA-PKCS1-v1_5");
      const expected = parseInt(alg.slice(2), 10);
      const actual = getHashLength(key.algorithm.hash);
      if (actual !== expected)
        throw unusable(`SHA-${expected}`, "algorithm.hash");
      break;
    }
    case "PS256":
    case "PS384":
    case "PS512": {
      if (!isAlgorithm(key.algorithm, "RSA-PSS"))
        throw unusable("RSA-PSS");
      const expected = parseInt(alg.slice(2), 10);
      const actual = getHashLength(key.algorithm.hash);
      if (actual !== expected)
        throw unusable(`SHA-${expected}`, "algorithm.hash");
      break;
    }
    case "Ed25519":
    case "EdDSA": {
      if (!isAlgorithm(key.algorithm, "Ed25519"))
        throw unusable("Ed25519");
      break;
    }
    case "ML-DSA-44":
    case "ML-DSA-65":
    case "ML-DSA-87": {
      if (!isAlgorithm(key.algorithm, alg))
        throw unusable(alg);
      break;
    }
    case "ES256":
    case "ES384":
    case "ES512": {
      if (!isAlgorithm(key.algorithm, "ECDSA"))
        throw unusable("ECDSA");
      const expected = getNamedCurve(alg);
      const actual = key.algorithm.namedCurve;
      if (actual !== expected)
        throw unusable(expected, "algorithm.namedCurve");
      break;
    }
    default:
      throw new TypeError("CryptoKey does not support this operation");
  }
  checkUsage(key, usage);
}
__name(checkSigCryptoKey, "checkSigCryptoKey");

// node_modules/.pnpm/jose@6.1.3/node_modules/jose/dist/webapi/lib/invalid_key_input.js
function message(msg, actual, ...types) {
  types = types.filter(Boolean);
  if (types.length > 2) {
    const last = types.pop();
    msg += `one of type ${types.join(", ")}, or ${last}.`;
  } else if (types.length === 2) {
    msg += `one of type ${types[0]} or ${types[1]}.`;
  } else {
    msg += `of type ${types[0]}.`;
  }
  if (actual == null) {
    msg += ` Received ${actual}`;
  } else if (typeof actual === "function" && actual.name) {
    msg += ` Received function ${actual.name}`;
  } else if (typeof actual === "object" && actual != null) {
    if (actual.constructor?.name) {
      msg += ` Received an instance of ${actual.constructor.name}`;
    }
  }
  return msg;
}
__name(message, "message");
var invalidKeyInput = /* @__PURE__ */ __name((actual, ...types) => message("Key must be ", actual, ...types), "invalidKeyInput");
var withAlg = /* @__PURE__ */ __name((alg, actual, ...types) => message(`Key for the ${alg} algorithm must be `, actual, ...types), "withAlg");

// node_modules/.pnpm/jose@6.1.3/node_modules/jose/dist/webapi/lib/is_key_like.js
var isCryptoKey = /* @__PURE__ */ __name((key) => {
  if (key?.[Symbol.toStringTag] === "CryptoKey")
    return true;
  try {
    return key instanceof CryptoKey;
  } catch {
    return false;
  }
}, "isCryptoKey");
var isKeyObject = /* @__PURE__ */ __name((key) => key?.[Symbol.toStringTag] === "KeyObject", "isKeyObject");
var isKeyLike = /* @__PURE__ */ __name((key) => isCryptoKey(key) || isKeyObject(key), "isKeyLike");

// node_modules/.pnpm/jose@6.1.3/node_modules/jose/dist/webapi/lib/is_disjoint.js
function isDisjoint(...headers) {
  const sources = headers.filter(Boolean);
  if (sources.length === 0 || sources.length === 1) {
    return true;
  }
  let acc;
  for (const header of sources) {
    const parameters = Object.keys(header);
    if (!acc || acc.size === 0) {
      acc = new Set(parameters);
      continue;
    }
    for (const parameter of parameters) {
      if (acc.has(parameter)) {
        return false;
      }
      acc.add(parameter);
    }
  }
  return true;
}
__name(isDisjoint, "isDisjoint");

// node_modules/.pnpm/jose@6.1.3/node_modules/jose/dist/webapi/lib/is_object.js
var isObjectLike = /* @__PURE__ */ __name((value) => typeof value === "object" && value !== null, "isObjectLike");
function isObject(input) {
  if (!isObjectLike(input) || Object.prototype.toString.call(input) !== "[object Object]") {
    return false;
  }
  if (Object.getPrototypeOf(input) === null) {
    return true;
  }
  let proto = input;
  while (Object.getPrototypeOf(proto) !== null) {
    proto = Object.getPrototypeOf(proto);
  }
  return Object.getPrototypeOf(input) === proto;
}
__name(isObject, "isObject");

// node_modules/.pnpm/jose@6.1.3/node_modules/jose/dist/webapi/lib/check_key_length.js
function checkKeyLength(alg, key) {
  if (alg.startsWith("RS") || alg.startsWith("PS")) {
    const { modulusLength } = key.algorithm;
    if (typeof modulusLength !== "number" || modulusLength < 2048) {
      throw new TypeError(`${alg} requires key modulusLength to be 2048 bits or larger`);
    }
  }
}
__name(checkKeyLength, "checkKeyLength");

// node_modules/.pnpm/jose@6.1.3/node_modules/jose/dist/webapi/lib/jwk_to_key.js
function subtleMapping(jwk) {
  let algorithm;
  let keyUsages;
  switch (jwk.kty) {
    case "AKP": {
      switch (jwk.alg) {
        case "ML-DSA-44":
        case "ML-DSA-65":
        case "ML-DSA-87":
          algorithm = { name: jwk.alg };
          keyUsages = jwk.priv ? ["sign"] : ["verify"];
          break;
        default:
          throw new JOSENotSupported('Invalid or unsupported JWK "alg" (Algorithm) Parameter value');
      }
      break;
    }
    case "RSA": {
      switch (jwk.alg) {
        case "PS256":
        case "PS384":
        case "PS512":
          algorithm = { name: "RSA-PSS", hash: `SHA-${jwk.alg.slice(-3)}` };
          keyUsages = jwk.d ? ["sign"] : ["verify"];
          break;
        case "RS256":
        case "RS384":
        case "RS512":
          algorithm = { name: "RSASSA-PKCS1-v1_5", hash: `SHA-${jwk.alg.slice(-3)}` };
          keyUsages = jwk.d ? ["sign"] : ["verify"];
          break;
        case "RSA-OAEP":
        case "RSA-OAEP-256":
        case "RSA-OAEP-384":
        case "RSA-OAEP-512":
          algorithm = {
            name: "RSA-OAEP",
            hash: `SHA-${parseInt(jwk.alg.slice(-3), 10) || 1}`
          };
          keyUsages = jwk.d ? ["decrypt", "unwrapKey"] : ["encrypt", "wrapKey"];
          break;
        default:
          throw new JOSENotSupported('Invalid or unsupported JWK "alg" (Algorithm) Parameter value');
      }
      break;
    }
    case "EC": {
      switch (jwk.alg) {
        case "ES256":
          algorithm = { name: "ECDSA", namedCurve: "P-256" };
          keyUsages = jwk.d ? ["sign"] : ["verify"];
          break;
        case "ES384":
          algorithm = { name: "ECDSA", namedCurve: "P-384" };
          keyUsages = jwk.d ? ["sign"] : ["verify"];
          break;
        case "ES512":
          algorithm = { name: "ECDSA", namedCurve: "P-521" };
          keyUsages = jwk.d ? ["sign"] : ["verify"];
          break;
        case "ECDH-ES":
        case "ECDH-ES+A128KW":
        case "ECDH-ES+A192KW":
        case "ECDH-ES+A256KW":
          algorithm = { name: "ECDH", namedCurve: jwk.crv };
          keyUsages = jwk.d ? ["deriveBits"] : [];
          break;
        default:
          throw new JOSENotSupported('Invalid or unsupported JWK "alg" (Algorithm) Parameter value');
      }
      break;
    }
    case "OKP": {
      switch (jwk.alg) {
        case "Ed25519":
        case "EdDSA":
          algorithm = { name: "Ed25519" };
          keyUsages = jwk.d ? ["sign"] : ["verify"];
          break;
        case "ECDH-ES":
        case "ECDH-ES+A128KW":
        case "ECDH-ES+A192KW":
        case "ECDH-ES+A256KW":
          algorithm = { name: jwk.crv };
          keyUsages = jwk.d ? ["deriveBits"] : [];
          break;
        default:
          throw new JOSENotSupported('Invalid or unsupported JWK "alg" (Algorithm) Parameter value');
      }
      break;
    }
    default:
      throw new JOSENotSupported('Invalid or unsupported JWK "kty" (Key Type) Parameter value');
  }
  return { algorithm, keyUsages };
}
__name(subtleMapping, "subtleMapping");
async function jwkToKey(jwk) {
  if (!jwk.alg) {
    throw new TypeError('"alg" argument is required when "jwk.alg" is not present');
  }
  const { algorithm, keyUsages } = subtleMapping(jwk);
  const keyData = { ...jwk };
  if (keyData.kty !== "AKP") {
    delete keyData.alg;
  }
  delete keyData.use;
  return crypto.subtle.importKey("jwk", keyData, algorithm, jwk.ext ?? (jwk.d || jwk.priv ? false : true), jwk.key_ops ?? keyUsages);
}
__name(jwkToKey, "jwkToKey");

// node_modules/.pnpm/jose@6.1.3/node_modules/jose/dist/webapi/lib/validate_crit.js
function validateCrit(Err, recognizedDefault, recognizedOption, protectedHeader, joseHeader) {
  if (joseHeader.crit !== void 0 && protectedHeader?.crit === void 0) {
    throw new Err('"crit" (Critical) Header Parameter MUST be integrity protected');
  }
  if (!protectedHeader || protectedHeader.crit === void 0) {
    return /* @__PURE__ */ new Set();
  }
  if (!Array.isArray(protectedHeader.crit) || protectedHeader.crit.length === 0 || protectedHeader.crit.some((input) => typeof input !== "string" || input.length === 0)) {
    throw new Err('"crit" (Critical) Header Parameter MUST be an array of non-empty strings when present');
  }
  let recognized;
  if (recognizedOption !== void 0) {
    recognized = new Map([...Object.entries(recognizedOption), ...recognizedDefault.entries()]);
  } else {
    recognized = recognizedDefault;
  }
  for (const parameter of protectedHeader.crit) {
    if (!recognized.has(parameter)) {
      throw new JOSENotSupported(`Extension Header Parameter "${parameter}" is not recognized`);
    }
    if (joseHeader[parameter] === void 0) {
      throw new Err(`Extension Header Parameter "${parameter}" is missing`);
    }
    if (recognized.get(parameter) && protectedHeader[parameter] === void 0) {
      throw new Err(`Extension Header Parameter "${parameter}" MUST be integrity protected`);
    }
  }
  return new Set(protectedHeader.crit);
}
__name(validateCrit, "validateCrit");

// node_modules/.pnpm/jose@6.1.3/node_modules/jose/dist/webapi/lib/validate_algorithms.js
function validateAlgorithms(option, algorithms) {
  if (algorithms !== void 0 && (!Array.isArray(algorithms) || algorithms.some((s) => typeof s !== "string"))) {
    throw new TypeError(`"${option}" option must be an array of strings`);
  }
  if (!algorithms) {
    return void 0;
  }
  return new Set(algorithms);
}
__name(validateAlgorithms, "validateAlgorithms");

// node_modules/.pnpm/jose@6.1.3/node_modules/jose/dist/webapi/lib/is_jwk.js
var isJWK = /* @__PURE__ */ __name((key) => isObject(key) && typeof key.kty === "string", "isJWK");
var isPrivateJWK = /* @__PURE__ */ __name((key) => key.kty !== "oct" && (key.kty === "AKP" && typeof key.priv === "string" || typeof key.d === "string"), "isPrivateJWK");
var isPublicJWK = /* @__PURE__ */ __name((key) => key.kty !== "oct" && key.d === void 0 && key.priv === void 0, "isPublicJWK");
var isSecretJWK = /* @__PURE__ */ __name((key) => key.kty === "oct" && typeof key.k === "string", "isSecretJWK");

// node_modules/.pnpm/jose@6.1.3/node_modules/jose/dist/webapi/lib/normalize_key.js
var cache;
var handleJWK = /* @__PURE__ */ __name(async (key, jwk, alg, freeze = false) => {
  cache ||= /* @__PURE__ */ new WeakMap();
  let cached = cache.get(key);
  if (cached?.[alg]) {
    return cached[alg];
  }
  const cryptoKey = await jwkToKey({ ...jwk, alg });
  if (freeze)
    Object.freeze(key);
  if (!cached) {
    cache.set(key, { [alg]: cryptoKey });
  } else {
    cached[alg] = cryptoKey;
  }
  return cryptoKey;
}, "handleJWK");
var handleKeyObject = /* @__PURE__ */ __name((keyObject, alg) => {
  cache ||= /* @__PURE__ */ new WeakMap();
  let cached = cache.get(keyObject);
  if (cached?.[alg]) {
    return cached[alg];
  }
  const isPublic = keyObject.type === "public";
  const extractable = isPublic ? true : false;
  let cryptoKey;
  if (keyObject.asymmetricKeyType === "x25519") {
    switch (alg) {
      case "ECDH-ES":
      case "ECDH-ES+A128KW":
      case "ECDH-ES+A192KW":
      case "ECDH-ES+A256KW":
        break;
      default:
        throw new TypeError("given KeyObject instance cannot be used for this algorithm");
    }
    cryptoKey = keyObject.toCryptoKey(keyObject.asymmetricKeyType, extractable, isPublic ? [] : ["deriveBits"]);
  }
  if (keyObject.asymmetricKeyType === "ed25519") {
    if (alg !== "EdDSA" && alg !== "Ed25519") {
      throw new TypeError("given KeyObject instance cannot be used for this algorithm");
    }
    cryptoKey = keyObject.toCryptoKey(keyObject.asymmetricKeyType, extractable, [
      isPublic ? "verify" : "sign"
    ]);
  }
  switch (keyObject.asymmetricKeyType) {
    case "ml-dsa-44":
    case "ml-dsa-65":
    case "ml-dsa-87": {
      if (alg !== keyObject.asymmetricKeyType.toUpperCase()) {
        throw new TypeError("given KeyObject instance cannot be used for this algorithm");
      }
      cryptoKey = keyObject.toCryptoKey(keyObject.asymmetricKeyType, extractable, [
        isPublic ? "verify" : "sign"
      ]);
    }
  }
  if (keyObject.asymmetricKeyType === "rsa") {
    let hash;
    switch (alg) {
      case "RSA-OAEP":
        hash = "SHA-1";
        break;
      case "RS256":
      case "PS256":
      case "RSA-OAEP-256":
        hash = "SHA-256";
        break;
      case "RS384":
      case "PS384":
      case "RSA-OAEP-384":
        hash = "SHA-384";
        break;
      case "RS512":
      case "PS512":
      case "RSA-OAEP-512":
        hash = "SHA-512";
        break;
      default:
        throw new TypeError("given KeyObject instance cannot be used for this algorithm");
    }
    if (alg.startsWith("RSA-OAEP")) {
      return keyObject.toCryptoKey({
        name: "RSA-OAEP",
        hash
      }, extractable, isPublic ? ["encrypt"] : ["decrypt"]);
    }
    cryptoKey = keyObject.toCryptoKey({
      name: alg.startsWith("PS") ? "RSA-PSS" : "RSASSA-PKCS1-v1_5",
      hash
    }, extractable, [isPublic ? "verify" : "sign"]);
  }
  if (keyObject.asymmetricKeyType === "ec") {
    const nist = /* @__PURE__ */ new Map([
      ["prime256v1", "P-256"],
      ["secp384r1", "P-384"],
      ["secp521r1", "P-521"]
    ]);
    const namedCurve = nist.get(keyObject.asymmetricKeyDetails?.namedCurve);
    if (!namedCurve) {
      throw new TypeError("given KeyObject instance cannot be used for this algorithm");
    }
    if (alg === "ES256" && namedCurve === "P-256") {
      cryptoKey = keyObject.toCryptoKey({
        name: "ECDSA",
        namedCurve
      }, extractable, [isPublic ? "verify" : "sign"]);
    }
    if (alg === "ES384" && namedCurve === "P-384") {
      cryptoKey = keyObject.toCryptoKey({
        name: "ECDSA",
        namedCurve
      }, extractable, [isPublic ? "verify" : "sign"]);
    }
    if (alg === "ES512" && namedCurve === "P-521") {
      cryptoKey = keyObject.toCryptoKey({
        name: "ECDSA",
        namedCurve
      }, extractable, [isPublic ? "verify" : "sign"]);
    }
    if (alg.startsWith("ECDH-ES")) {
      cryptoKey = keyObject.toCryptoKey({
        name: "ECDH",
        namedCurve
      }, extractable, isPublic ? [] : ["deriveBits"]);
    }
  }
  if (!cryptoKey) {
    throw new TypeError("given KeyObject instance cannot be used for this algorithm");
  }
  if (!cached) {
    cache.set(keyObject, { [alg]: cryptoKey });
  } else {
    cached[alg] = cryptoKey;
  }
  return cryptoKey;
}, "handleKeyObject");
async function normalizeKey(key, alg) {
  if (key instanceof Uint8Array) {
    return key;
  }
  if (isCryptoKey(key)) {
    return key;
  }
  if (isKeyObject(key)) {
    if (key.type === "secret") {
      return key.export();
    }
    if ("toCryptoKey" in key && typeof key.toCryptoKey === "function") {
      try {
        return handleKeyObject(key, alg);
      } catch (err) {
        if (err instanceof TypeError) {
          throw err;
        }
      }
    }
    let jwk = key.export({ format: "jwk" });
    return handleJWK(key, jwk, alg);
  }
  if (isJWK(key)) {
    if (key.k) {
      return decode(key.k);
    }
    return handleJWK(key, key, alg, true);
  }
  throw new Error("unreachable");
}
__name(normalizeKey, "normalizeKey");

// node_modules/.pnpm/jose@6.1.3/node_modules/jose/dist/webapi/lib/check_key_type.js
var tag = /* @__PURE__ */ __name((key) => key?.[Symbol.toStringTag], "tag");
var jwkMatchesOp = /* @__PURE__ */ __name((alg, key, usage) => {
  if (key.use !== void 0) {
    let expected;
    switch (usage) {
      case "sign":
      case "verify":
        expected = "sig";
        break;
      case "encrypt":
      case "decrypt":
        expected = "enc";
        break;
    }
    if (key.use !== expected) {
      throw new TypeError(`Invalid key for this operation, its "use" must be "${expected}" when present`);
    }
  }
  if (key.alg !== void 0 && key.alg !== alg) {
    throw new TypeError(`Invalid key for this operation, its "alg" must be "${alg}" when present`);
  }
  if (Array.isArray(key.key_ops)) {
    let expectedKeyOp;
    switch (true) {
      case (usage === "sign" || usage === "verify"):
      case alg === "dir":
      case alg.includes("CBC-HS"):
        expectedKeyOp = usage;
        break;
      case alg.startsWith("PBES2"):
        expectedKeyOp = "deriveBits";
        break;
      case /^A\d{3}(?:GCM)?(?:KW)?$/.test(alg):
        if (!alg.includes("GCM") && alg.endsWith("KW")) {
          expectedKeyOp = usage === "encrypt" ? "wrapKey" : "unwrapKey";
        } else {
          expectedKeyOp = usage;
        }
        break;
      case (usage === "encrypt" && alg.startsWith("RSA")):
        expectedKeyOp = "wrapKey";
        break;
      case usage === "decrypt":
        expectedKeyOp = alg.startsWith("RSA") ? "unwrapKey" : "deriveBits";
        break;
    }
    if (expectedKeyOp && key.key_ops?.includes?.(expectedKeyOp) === false) {
      throw new TypeError(`Invalid key for this operation, its "key_ops" must include "${expectedKeyOp}" when present`);
    }
  }
  return true;
}, "jwkMatchesOp");
var symmetricTypeCheck = /* @__PURE__ */ __name((alg, key, usage) => {
  if (key instanceof Uint8Array)
    return;
  if (isJWK(key)) {
    if (isSecretJWK(key) && jwkMatchesOp(alg, key, usage))
      return;
    throw new TypeError(`JSON Web Key for symmetric algorithms must have JWK "kty" (Key Type) equal to "oct" and the JWK "k" (Key Value) present`);
  }
  if (!isKeyLike(key)) {
    throw new TypeError(withAlg(alg, key, "CryptoKey", "KeyObject", "JSON Web Key", "Uint8Array"));
  }
  if (key.type !== "secret") {
    throw new TypeError(`${tag(key)} instances for symmetric algorithms must be of type "secret"`);
  }
}, "symmetricTypeCheck");
var asymmetricTypeCheck = /* @__PURE__ */ __name((alg, key, usage) => {
  if (isJWK(key)) {
    switch (usage) {
      case "decrypt":
      case "sign":
        if (isPrivateJWK(key) && jwkMatchesOp(alg, key, usage))
          return;
        throw new TypeError(`JSON Web Key for this operation must be a private JWK`);
      case "encrypt":
      case "verify":
        if (isPublicJWK(key) && jwkMatchesOp(alg, key, usage))
          return;
        throw new TypeError(`JSON Web Key for this operation must be a public JWK`);
    }
  }
  if (!isKeyLike(key)) {
    throw new TypeError(withAlg(alg, key, "CryptoKey", "KeyObject", "JSON Web Key"));
  }
  if (key.type === "secret") {
    throw new TypeError(`${tag(key)} instances for asymmetric algorithms must not be of type "secret"`);
  }
  if (key.type === "public") {
    switch (usage) {
      case "sign":
        throw new TypeError(`${tag(key)} instances for asymmetric algorithm signing must be of type "private"`);
      case "decrypt":
        throw new TypeError(`${tag(key)} instances for asymmetric algorithm decryption must be of type "private"`);
    }
  }
  if (key.type === "private") {
    switch (usage) {
      case "verify":
        throw new TypeError(`${tag(key)} instances for asymmetric algorithm verifying must be of type "public"`);
      case "encrypt":
        throw new TypeError(`${tag(key)} instances for asymmetric algorithm encryption must be of type "public"`);
    }
  }
}, "asymmetricTypeCheck");
function checkKeyType(alg, key, usage) {
  switch (alg.substring(0, 2)) {
    case "A1":
    case "A2":
    case "di":
    case "HS":
    case "PB":
      symmetricTypeCheck(alg, key, usage);
      break;
    default:
      asymmetricTypeCheck(alg, key, usage);
  }
}
__name(checkKeyType, "checkKeyType");

// node_modules/.pnpm/jose@6.1.3/node_modules/jose/dist/webapi/lib/subtle_dsa.js
function subtleAlgorithm(alg, algorithm) {
  const hash = `SHA-${alg.slice(-3)}`;
  switch (alg) {
    case "HS256":
    case "HS384":
    case "HS512":
      return { hash, name: "HMAC" };
    case "PS256":
    case "PS384":
    case "PS512":
      return { hash, name: "RSA-PSS", saltLength: parseInt(alg.slice(-3), 10) >> 3 };
    case "RS256":
    case "RS384":
    case "RS512":
      return { hash, name: "RSASSA-PKCS1-v1_5" };
    case "ES256":
    case "ES384":
    case "ES512":
      return { hash, name: "ECDSA", namedCurve: algorithm.namedCurve };
    case "Ed25519":
    case "EdDSA":
      return { name: "Ed25519" };
    case "ML-DSA-44":
    case "ML-DSA-65":
    case "ML-DSA-87":
      return { name: alg };
    default:
      throw new JOSENotSupported(`alg ${alg} is not supported either by JOSE or your javascript runtime`);
  }
}
__name(subtleAlgorithm, "subtleAlgorithm");

// node_modules/.pnpm/jose@6.1.3/node_modules/jose/dist/webapi/lib/get_sign_verify_key.js
async function getSigKey(alg, key, usage) {
  if (key instanceof Uint8Array) {
    if (!alg.startsWith("HS")) {
      throw new TypeError(invalidKeyInput(key, "CryptoKey", "KeyObject", "JSON Web Key"));
    }
    return crypto.subtle.importKey("raw", key, { hash: `SHA-${alg.slice(-3)}`, name: "HMAC" }, false, [usage]);
  }
  checkSigCryptoKey(key, alg, usage);
  return key;
}
__name(getSigKey, "getSigKey");

// node_modules/.pnpm/jose@6.1.3/node_modules/jose/dist/webapi/lib/verify.js
async function verify(alg, key, signature, data) {
  const cryptoKey = await getSigKey(alg, key, "verify");
  checkKeyLength(alg, cryptoKey);
  const algorithm = subtleAlgorithm(alg, cryptoKey.algorithm);
  try {
    return await crypto.subtle.verify(algorithm, cryptoKey, signature, data);
  } catch {
    return false;
  }
}
__name(verify, "verify");

// node_modules/.pnpm/jose@6.1.3/node_modules/jose/dist/webapi/jws/flattened/verify.js
async function flattenedVerify(jws, key, options) {
  if (!isObject(jws)) {
    throw new JWSInvalid("Flattened JWS must be an object");
  }
  if (jws.protected === void 0 && jws.header === void 0) {
    throw new JWSInvalid('Flattened JWS must have either of the "protected" or "header" members');
  }
  if (jws.protected !== void 0 && typeof jws.protected !== "string") {
    throw new JWSInvalid("JWS Protected Header incorrect type");
  }
  if (jws.payload === void 0) {
    throw new JWSInvalid("JWS Payload missing");
  }
  if (typeof jws.signature !== "string") {
    throw new JWSInvalid("JWS Signature missing or incorrect type");
  }
  if (jws.header !== void 0 && !isObject(jws.header)) {
    throw new JWSInvalid("JWS Unprotected Header incorrect type");
  }
  let parsedProt = {};
  if (jws.protected) {
    try {
      const protectedHeader = decode(jws.protected);
      parsedProt = JSON.parse(decoder.decode(protectedHeader));
    } catch {
      throw new JWSInvalid("JWS Protected Header is invalid");
    }
  }
  if (!isDisjoint(parsedProt, jws.header)) {
    throw new JWSInvalid("JWS Protected and JWS Unprotected Header Parameter names must be disjoint");
  }
  const joseHeader = {
    ...parsedProt,
    ...jws.header
  };
  const extensions = validateCrit(JWSInvalid, /* @__PURE__ */ new Map([["b64", true]]), options?.crit, parsedProt, joseHeader);
  let b64 = true;
  if (extensions.has("b64")) {
    b64 = parsedProt.b64;
    if (typeof b64 !== "boolean") {
      throw new JWSInvalid('The "b64" (base64url-encode payload) Header Parameter must be a boolean');
    }
  }
  const { alg } = joseHeader;
  if (typeof alg !== "string" || !alg) {
    throw new JWSInvalid('JWS "alg" (Algorithm) Header Parameter missing or invalid');
  }
  const algorithms = options && validateAlgorithms("algorithms", options.algorithms);
  if (algorithms && !algorithms.has(alg)) {
    throw new JOSEAlgNotAllowed('"alg" (Algorithm) Header Parameter value not allowed');
  }
  if (b64) {
    if (typeof jws.payload !== "string") {
      throw new JWSInvalid("JWS Payload must be a string");
    }
  } else if (typeof jws.payload !== "string" && !(jws.payload instanceof Uint8Array)) {
    throw new JWSInvalid("JWS Payload must be a string or an Uint8Array instance");
  }
  let resolvedKey = false;
  if (typeof key === "function") {
    key = await key(parsedProt, jws);
    resolvedKey = true;
  }
  checkKeyType(alg, key, "verify");
  const data = concat(jws.protected !== void 0 ? encode(jws.protected) : new Uint8Array(), encode("."), typeof jws.payload === "string" ? b64 ? encode(jws.payload) : encoder.encode(jws.payload) : jws.payload);
  let signature;
  try {
    signature = decode(jws.signature);
  } catch {
    throw new JWSInvalid("Failed to base64url decode the signature");
  }
  const k2 = await normalizeKey(key, alg);
  const verified = await verify(alg, k2, signature, data);
  if (!verified) {
    throw new JWSSignatureVerificationFailed();
  }
  let payload;
  if (b64) {
    try {
      payload = decode(jws.payload);
    } catch {
      throw new JWSInvalid("Failed to base64url decode the payload");
    }
  } else if (typeof jws.payload === "string") {
    payload = encoder.encode(jws.payload);
  } else {
    payload = jws.payload;
  }
  const result = { payload };
  if (jws.protected !== void 0) {
    result.protectedHeader = parsedProt;
  }
  if (jws.header !== void 0) {
    result.unprotectedHeader = jws.header;
  }
  if (resolvedKey) {
    return { ...result, key: k2 };
  }
  return result;
}
__name(flattenedVerify, "flattenedVerify");

// node_modules/.pnpm/jose@6.1.3/node_modules/jose/dist/webapi/jws/compact/verify.js
async function compactVerify(jws, key, options) {
  if (jws instanceof Uint8Array) {
    jws = decoder.decode(jws);
  }
  if (typeof jws !== "string") {
    throw new JWSInvalid("Compact JWS must be a string or Uint8Array");
  }
  const { 0: protectedHeader, 1: payload, 2: signature, length } = jws.split(".");
  if (length !== 3) {
    throw new JWSInvalid("Invalid Compact JWS");
  }
  const verified = await flattenedVerify({ payload, protected: protectedHeader, signature }, key, options);
  const result = { payload: verified.payload, protectedHeader: verified.protectedHeader };
  if (typeof key === "function") {
    return { ...result, key: verified.key };
  }
  return result;
}
__name(compactVerify, "compactVerify");

// node_modules/.pnpm/jose@6.1.3/node_modules/jose/dist/webapi/lib/jwt_claims_set.js
var epoch = /* @__PURE__ */ __name((date) => Math.floor(date.getTime() / 1e3), "epoch");
var minute = 60;
var hour = minute * 60;
var day = hour * 24;
var week = day * 7;
var year = day * 365.25;
var REGEX = /^(\+|\-)? ?(\d+|\d+\.\d+) ?(seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)(?: (ago|from now))?$/i;
function secs(str) {
  const matched = REGEX.exec(str);
  if (!matched || matched[4] && matched[1]) {
    throw new TypeError("Invalid time period format");
  }
  const value = parseFloat(matched[2]);
  const unit = matched[3].toLowerCase();
  let numericDate;
  switch (unit) {
    case "sec":
    case "secs":
    case "second":
    case "seconds":
    case "s":
      numericDate = Math.round(value);
      break;
    case "minute":
    case "minutes":
    case "min":
    case "mins":
    case "m":
      numericDate = Math.round(value * minute);
      break;
    case "hour":
    case "hours":
    case "hr":
    case "hrs":
    case "h":
      numericDate = Math.round(value * hour);
      break;
    case "day":
    case "days":
    case "d":
      numericDate = Math.round(value * day);
      break;
    case "week":
    case "weeks":
    case "w":
      numericDate = Math.round(value * week);
      break;
    default:
      numericDate = Math.round(value * year);
      break;
  }
  if (matched[1] === "-" || matched[4] === "ago") {
    return -numericDate;
  }
  return numericDate;
}
__name(secs, "secs");
function validateInput(label, input) {
  if (!Number.isFinite(input)) {
    throw new TypeError(`Invalid ${label} input`);
  }
  return input;
}
__name(validateInput, "validateInput");
var normalizeTyp = /* @__PURE__ */ __name((value) => {
  if (value.includes("/")) {
    return value.toLowerCase();
  }
  return `application/${value.toLowerCase()}`;
}, "normalizeTyp");
var checkAudiencePresence = /* @__PURE__ */ __name((audPayload, audOption) => {
  if (typeof audPayload === "string") {
    return audOption.includes(audPayload);
  }
  if (Array.isArray(audPayload)) {
    return audOption.some(Set.prototype.has.bind(new Set(audPayload)));
  }
  return false;
}, "checkAudiencePresence");
function validateClaimsSet(protectedHeader, encodedPayload, options = {}) {
  let payload;
  try {
    payload = JSON.parse(decoder.decode(encodedPayload));
  } catch {
  }
  if (!isObject(payload)) {
    throw new JWTInvalid("JWT Claims Set must be a top-level JSON object");
  }
  const { typ } = options;
  if (typ && (typeof protectedHeader.typ !== "string" || normalizeTyp(protectedHeader.typ) !== normalizeTyp(typ))) {
    throw new JWTClaimValidationFailed('unexpected "typ" JWT header value', payload, "typ", "check_failed");
  }
  const { requiredClaims = [], issuer, subject, audience, maxTokenAge } = options;
  const presenceCheck = [...requiredClaims];
  if (maxTokenAge !== void 0)
    presenceCheck.push("iat");
  if (audience !== void 0)
    presenceCheck.push("aud");
  if (subject !== void 0)
    presenceCheck.push("sub");
  if (issuer !== void 0)
    presenceCheck.push("iss");
  for (const claim of new Set(presenceCheck.reverse())) {
    if (!(claim in payload)) {
      throw new JWTClaimValidationFailed(`missing required "${claim}" claim`, payload, claim, "missing");
    }
  }
  if (issuer && !(Array.isArray(issuer) ? issuer : [issuer]).includes(payload.iss)) {
    throw new JWTClaimValidationFailed('unexpected "iss" claim value', payload, "iss", "check_failed");
  }
  if (subject && payload.sub !== subject) {
    throw new JWTClaimValidationFailed('unexpected "sub" claim value', payload, "sub", "check_failed");
  }
  if (audience && !checkAudiencePresence(payload.aud, typeof audience === "string" ? [audience] : audience)) {
    throw new JWTClaimValidationFailed('unexpected "aud" claim value', payload, "aud", "check_failed");
  }
  let tolerance;
  switch (typeof options.clockTolerance) {
    case "string":
      tolerance = secs(options.clockTolerance);
      break;
    case "number":
      tolerance = options.clockTolerance;
      break;
    case "undefined":
      tolerance = 0;
      break;
    default:
      throw new TypeError("Invalid clockTolerance option type");
  }
  const { currentDate } = options;
  const now = epoch(currentDate || /* @__PURE__ */ new Date());
  if ((payload.iat !== void 0 || maxTokenAge) && typeof payload.iat !== "number") {
    throw new JWTClaimValidationFailed('"iat" claim must be a number', payload, "iat", "invalid");
  }
  if (payload.nbf !== void 0) {
    if (typeof payload.nbf !== "number") {
      throw new JWTClaimValidationFailed('"nbf" claim must be a number', payload, "nbf", "invalid");
    }
    if (payload.nbf > now + tolerance) {
      throw new JWTClaimValidationFailed('"nbf" claim timestamp check failed', payload, "nbf", "check_failed");
    }
  }
  if (payload.exp !== void 0) {
    if (typeof payload.exp !== "number") {
      throw new JWTClaimValidationFailed('"exp" claim must be a number', payload, "exp", "invalid");
    }
    if (payload.exp <= now - tolerance) {
      throw new JWTExpired('"exp" claim timestamp check failed', payload, "exp", "check_failed");
    }
  }
  if (maxTokenAge) {
    const age = now - payload.iat;
    const max = typeof maxTokenAge === "number" ? maxTokenAge : secs(maxTokenAge);
    if (age - tolerance > max) {
      throw new JWTExpired('"iat" claim timestamp check failed (too far in the past)', payload, "iat", "check_failed");
    }
    if (age < 0 - tolerance) {
      throw new JWTClaimValidationFailed('"iat" claim timestamp check failed (it should be in the past)', payload, "iat", "check_failed");
    }
  }
  return payload;
}
__name(validateClaimsSet, "validateClaimsSet");
var JWTClaimsBuilder = class {
  static {
    __name(this, "JWTClaimsBuilder");
  }
  #payload;
  constructor(payload) {
    if (!isObject(payload)) {
      throw new TypeError("JWT Claims Set MUST be an object");
    }
    this.#payload = structuredClone(payload);
  }
  data() {
    return encoder.encode(JSON.stringify(this.#payload));
  }
  get iss() {
    return this.#payload.iss;
  }
  set iss(value) {
    this.#payload.iss = value;
  }
  get sub() {
    return this.#payload.sub;
  }
  set sub(value) {
    this.#payload.sub = value;
  }
  get aud() {
    return this.#payload.aud;
  }
  set aud(value) {
    this.#payload.aud = value;
  }
  set jti(value) {
    this.#payload.jti = value;
  }
  set nbf(value) {
    if (typeof value === "number") {
      this.#payload.nbf = validateInput("setNotBefore", value);
    } else if (value instanceof Date) {
      this.#payload.nbf = validateInput("setNotBefore", epoch(value));
    } else {
      this.#payload.nbf = epoch(/* @__PURE__ */ new Date()) + secs(value);
    }
  }
  set exp(value) {
    if (typeof value === "number") {
      this.#payload.exp = validateInput("setExpirationTime", value);
    } else if (value instanceof Date) {
      this.#payload.exp = validateInput("setExpirationTime", epoch(value));
    } else {
      this.#payload.exp = epoch(/* @__PURE__ */ new Date()) + secs(value);
    }
  }
  set iat(value) {
    if (value === void 0) {
      this.#payload.iat = epoch(/* @__PURE__ */ new Date());
    } else if (value instanceof Date) {
      this.#payload.iat = validateInput("setIssuedAt", epoch(value));
    } else if (typeof value === "string") {
      this.#payload.iat = validateInput("setIssuedAt", epoch(/* @__PURE__ */ new Date()) + secs(value));
    } else {
      this.#payload.iat = validateInput("setIssuedAt", value);
    }
  }
};

// node_modules/.pnpm/jose@6.1.3/node_modules/jose/dist/webapi/jwt/verify.js
async function jwtVerify(jwt, key, options) {
  const verified = await compactVerify(jwt, key, options);
  if (verified.protectedHeader.crit?.includes("b64") && verified.protectedHeader.b64 === false) {
    throw new JWTInvalid("JWTs MUST NOT use unencoded payload");
  }
  const payload = validateClaimsSet(verified.protectedHeader, verified.payload, options);
  const result = { payload, protectedHeader: verified.protectedHeader };
  if (typeof key === "function") {
    return { ...result, key: verified.key };
  }
  return result;
}
__name(jwtVerify, "jwtVerify");

// node_modules/.pnpm/jose@6.1.3/node_modules/jose/dist/webapi/lib/sign.js
async function sign(alg, key, data) {
  const cryptoKey = await getSigKey(alg, key, "sign");
  checkKeyLength(alg, cryptoKey);
  const signature = await crypto.subtle.sign(subtleAlgorithm(alg, cryptoKey.algorithm), cryptoKey, data);
  return new Uint8Array(signature);
}
__name(sign, "sign");

// node_modules/.pnpm/jose@6.1.3/node_modules/jose/dist/webapi/jws/flattened/sign.js
var FlattenedSign = class {
  static {
    __name(this, "FlattenedSign");
  }
  #payload;
  #protectedHeader;
  #unprotectedHeader;
  constructor(payload) {
    if (!(payload instanceof Uint8Array)) {
      throw new TypeError("payload must be an instance of Uint8Array");
    }
    this.#payload = payload;
  }
  setProtectedHeader(protectedHeader) {
    if (this.#protectedHeader) {
      throw new TypeError("setProtectedHeader can only be called once");
    }
    this.#protectedHeader = protectedHeader;
    return this;
  }
  setUnprotectedHeader(unprotectedHeader) {
    if (this.#unprotectedHeader) {
      throw new TypeError("setUnprotectedHeader can only be called once");
    }
    this.#unprotectedHeader = unprotectedHeader;
    return this;
  }
  async sign(key, options) {
    if (!this.#protectedHeader && !this.#unprotectedHeader) {
      throw new JWSInvalid("either setProtectedHeader or setUnprotectedHeader must be called before #sign()");
    }
    if (!isDisjoint(this.#protectedHeader, this.#unprotectedHeader)) {
      throw new JWSInvalid("JWS Protected and JWS Unprotected Header Parameter names must be disjoint");
    }
    const joseHeader = {
      ...this.#protectedHeader,
      ...this.#unprotectedHeader
    };
    const extensions = validateCrit(JWSInvalid, /* @__PURE__ */ new Map([["b64", true]]), options?.crit, this.#protectedHeader, joseHeader);
    let b64 = true;
    if (extensions.has("b64")) {
      b64 = this.#protectedHeader.b64;
      if (typeof b64 !== "boolean") {
        throw new JWSInvalid('The "b64" (base64url-encode payload) Header Parameter must be a boolean');
      }
    }
    const { alg } = joseHeader;
    if (typeof alg !== "string" || !alg) {
      throw new JWSInvalid('JWS "alg" (Algorithm) Header Parameter missing or invalid');
    }
    checkKeyType(alg, key, "sign");
    let payloadS;
    let payloadB;
    if (b64) {
      payloadS = encode2(this.#payload);
      payloadB = encode(payloadS);
    } else {
      payloadB = this.#payload;
      payloadS = "";
    }
    let protectedHeaderString;
    let protectedHeaderBytes;
    if (this.#protectedHeader) {
      protectedHeaderString = encode2(JSON.stringify(this.#protectedHeader));
      protectedHeaderBytes = encode(protectedHeaderString);
    } else {
      protectedHeaderString = "";
      protectedHeaderBytes = new Uint8Array();
    }
    const data = concat(protectedHeaderBytes, encode("."), payloadB);
    const k2 = await normalizeKey(key, alg);
    const signature = await sign(alg, k2, data);
    const jws = {
      signature: encode2(signature),
      payload: payloadS
    };
    if (this.#unprotectedHeader) {
      jws.header = this.#unprotectedHeader;
    }
    if (this.#protectedHeader) {
      jws.protected = protectedHeaderString;
    }
    return jws;
  }
};

// node_modules/.pnpm/jose@6.1.3/node_modules/jose/dist/webapi/jws/compact/sign.js
var CompactSign = class {
  static {
    __name(this, "CompactSign");
  }
  #flattened;
  constructor(payload) {
    this.#flattened = new FlattenedSign(payload);
  }
  setProtectedHeader(protectedHeader) {
    this.#flattened.setProtectedHeader(protectedHeader);
    return this;
  }
  async sign(key, options) {
    const jws = await this.#flattened.sign(key, options);
    if (jws.payload === void 0) {
      throw new TypeError("use the flattened module for creating JWS with b64: false");
    }
    return `${jws.protected}.${jws.payload}.${jws.signature}`;
  }
};

// node_modules/.pnpm/jose@6.1.3/node_modules/jose/dist/webapi/jwt/sign.js
var SignJWT = class {
  static {
    __name(this, "SignJWT");
  }
  #protectedHeader;
  #jwt;
  constructor(payload = {}) {
    this.#jwt = new JWTClaimsBuilder(payload);
  }
  setIssuer(issuer) {
    this.#jwt.iss = issuer;
    return this;
  }
  setSubject(subject) {
    this.#jwt.sub = subject;
    return this;
  }
  setAudience(audience) {
    this.#jwt.aud = audience;
    return this;
  }
  setJti(jwtId) {
    this.#jwt.jti = jwtId;
    return this;
  }
  setNotBefore(input) {
    this.#jwt.nbf = input;
    return this;
  }
  setExpirationTime(input) {
    this.#jwt.exp = input;
    return this;
  }
  setIssuedAt(input) {
    this.#jwt.iat = input;
    return this;
  }
  setProtectedHeader(protectedHeader) {
    this.#protectedHeader = protectedHeader;
    return this;
  }
  async sign(key, options) {
    const sig = new CompactSign(this.#jwt.data());
    sig.setProtectedHeader(this.#protectedHeader);
    if (Array.isArray(this.#protectedHeader?.crit) && this.#protectedHeader.crit.includes("b64") && this.#protectedHeader.b64 === false) {
      throw new JWTInvalid("JWTs MUST NOT use unencoded payload");
    }
    return sig.sign(key, options);
  }
};

// apps/api/src/lib/jwt.ts
var JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-jwt-secret-here-change-in-production"
);
var JWT_ISSUER = "skillomatic";
var JWT_AUDIENCE = "skillomatic-api";
var JWT_EXPIRATION = "7d";
async function createToken(user) {
  return new SignJWT({
    email: user.email,
    name: user.name,
    isAdmin: user.isAdmin,
    isSuperAdmin: user.isSuperAdmin ?? false,
    organizationId: user.organizationId ?? null
  }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setIssuer(JWT_ISSUER).setAudience(JWT_AUDIENCE).setSubject(user.id).setExpirationTime(JWT_EXPIRATION).sign(JWT_SECRET);
}
__name(createToken, "createToken");
async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE
    });
    const sub = payload.sub;
    return {
      sub,
      id: sub,
      // alias for convenience
      email: payload.email,
      name: payload.name,
      isAdmin: payload.isAdmin,
      isSuperAdmin: payload.isSuperAdmin ?? false,
      organizationId: payload.organizationId ?? null
    };
  } catch {
    return null;
  }
}
__name(verifyToken, "verifyToken");

// apps/api/src/routes/auth.ts
var authRoutes = new Hono2();
authRoutes.post("/login", async (c) => {
  const body = await c.req.json();
  if (!body.email || !body.password) {
    return c.json({ error: { message: "Email and password are required" } }, 400);
  }
  const user = await db.select().from(users).where(eq(users.email, body.email.toLowerCase())).limit(1);
  if (user.length === 0) {
    return c.json({ error: { message: "Invalid email or password" } }, 401);
  }
  const isValid = M(body.password, user[0].passwordHash);
  if (!isValid) {
    return c.json({ error: { message: "Invalid email or password" } }, 401);
  }
  let organizationName;
  if (user[0].organizationId) {
    const [org] = await db.select().from(organizations).where(eq(organizations.id, user[0].organizationId)).limit(1);
    organizationName = org?.name;
  }
  const userPublic = {
    id: user[0].id,
    email: user[0].email,
    name: user[0].name,
    avatarUrl: user[0].avatarUrl ?? void 0,
    isAdmin: user[0].isAdmin,
    isSuperAdmin: user[0].isSuperAdmin ?? false,
    organizationId: user[0].organizationId ?? void 0,
    organizationName,
    onboardingStep: user[0].onboardingStep ?? 0
  };
  const token = await createToken(userPublic);
  const response = {
    token,
    user: userPublic
  };
  return c.json({ data: response });
});
authRoutes.get("/me", async (c) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: { message: "Not authenticated" } }, 401);
  }
  const token = authHeader.slice(7);
  const payload = await verifyToken(token);
  if (!payload) {
    return c.json({ error: { message: "Invalid or expired token" } }, 401);
  }
  const user = await db.select().from(users).where(eq(users.id, payload.sub)).limit(1);
  if (user.length === 0) {
    return c.json({ error: { message: "User not found" } }, 404);
  }
  let organizationName;
  if (user[0].organizationId) {
    const [org] = await db.select().from(organizations).where(eq(organizations.id, user[0].organizationId)).limit(1);
    organizationName = org?.name;
  }
  const userPublic = {
    id: user[0].id,
    email: user[0].email,
    name: user[0].name,
    avatarUrl: user[0].avatarUrl ?? void 0,
    isAdmin: user[0].isAdmin,
    isSuperAdmin: user[0].isSuperAdmin ?? false,
    organizationId: user[0].organizationId ?? void 0,
    organizationName,
    onboardingStep: user[0].onboardingStep ?? 0
  };
  return c.json({ data: userPublic });
});
authRoutes.post("/logout", (c) => {
  return c.json({ data: { message: "Logged out" } });
});

// node_modules/.pnpm/hono@4.11.4/node_modules/hono/dist/helper/factory/index.js
var createMiddleware = /* @__PURE__ */ __name((middleware) => middleware, "createMiddleware");

// apps/api/src/middleware/combinedAuth.ts
var combinedAuth = createMiddleware(async (c, next) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: { message: "Missing or invalid Authorization header" } }, 401);
  }
  const token = authHeader.slice(7);
  if (token.startsWith("sk_")) {
    const result = await db.select().from(apiKeys).innerJoin(users, eq(apiKeys.userId, users.id)).where(
      and(
        eq(apiKeys.key, token),
        isNull(apiKeys.revokedAt)
      )
    ).limit(1);
    if (result.length === 0) {
      return c.json({ error: { message: "Invalid or revoked API key" } }, 401);
    }
    const row = result[0];
    const apiKey = row.api_keys;
    const user = row.users;
    db.update(apiKeys).set({ lastUsedAt: /* @__PURE__ */ new Date() }).where(eq(apiKeys.id, apiKey.id)).execute().catch(console.error);
    c.set("user", {
      sub: user.id,
      email: user.email,
      name: user.name,
      isAdmin: user.isAdmin,
      isSuperAdmin: user.isSuperAdmin ?? false,
      organizationId: user.organizationId ?? null
    });
    await next();
    return;
  }
  const payload = await verifyToken(token);
  if (!payload) {
    return c.json({ error: { message: "Invalid or expired token" } }, 401);
  }
  c.set("user", payload);
  await next();
});

// apps/api/src/lib/nango.ts
var NangoError = class extends Error {
  constructor(message2, statusCode, code) {
    super(message2);
    this.statusCode = statusCode;
    this.code = code;
    this.name = "NangoError";
  }
  static {
    __name(this, "NangoError");
  }
};
var NangoClient = class {
  static {
    __name(this, "NangoClient");
  }
  baseUrl;
  secretKey;
  constructor() {
    this.baseUrl = process.env.NANGO_HOST || "http://localhost:3003";
    this.secretKey = process.env.NANGO_SECRET_KEY || "";
    if (!this.secretKey) {
      console.warn("NANGO_SECRET_KEY not set - OAuth operations will fail");
    }
  }
  /**
   * Create a Connect session for frontend OAuth flow
   * Returns a short-lived token (30 min) that the frontend uses with Nango Connect UI
   */
  async createConnectSession(options) {
    const response = await fetch(`${this.baseUrl}/connect/sessions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        end_user: {
          id: options.userId,
          email: options.userEmail,
          display_name: options.userDisplayName
        },
        allowed_integrations: options.allowedIntegrations
      })
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new NangoError(
        error.message || `Failed to create connect session: ${response.status}`,
        response.status,
        error.code
      );
    }
    const data = await response.json();
    return {
      token: data.data.token,
      expiresAt: data.data.expires_at,
      connectLink: data.data.connect_link
    };
  }
  /**
   * @deprecated Use createConnectSession instead - public keys are deprecated
   * Generate the OAuth connect URL for a provider
   */
  getConnectUrl(providerConfigKey, connectionId, callbackUrl) {
    const params = new URLSearchParams({
      connection_id: connectionId,
      public_key: process.env.NANGO_PUBLIC_KEY || "",
      callback_url: callbackUrl
    });
    return `${this.baseUrl}/oauth/connect/${providerConfigKey}?${params.toString()}`;
  }
  /**
   * Get fresh access token for a connection
   * Nango handles token refresh automatically
   */
  async getToken(providerConfigKey, connectionId) {
    const response = await fetch(
      `${this.baseUrl}/connection/${connectionId}?provider_config_key=${providerConfigKey}`,
      {
        headers: {
          Authorization: `Bearer ${this.secretKey}`
        }
      }
    );
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new NangoError(
        error.message || `Failed to get token: ${response.status}`,
        response.status,
        error.code
      );
    }
    const connection = await response.json();
    return {
      access_token: connection.credentials?.access_token || "",
      refresh_token: connection.credentials?.refresh_token,
      expires_at: connection.credentials?.expires_at,
      token_type: connection.credentials?.token_type || "bearer",
      raw: connection.credentials || {}
    };
  }
  /**
   * Get connection status from Nango
   */
  async getConnection(providerConfigKey, connectionId) {
    try {
      const response = await fetch(
        `${this.baseUrl}/connection/${connectionId}?provider_config_key=${providerConfigKey}`,
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`
          }
        }
      );
      if (response.status === 404) {
        return null;
      }
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new NangoError(
          error.message || `Failed to get connection: ${response.status}`,
          response.status,
          error.code
        );
      }
      return response.json();
    } catch (error) {
      if (error instanceof NangoError) throw error;
      throw new NangoError(`Network error getting connection: ${error}`);
    }
  }
  /**
   * Delete a connection from Nango
   */
  async deleteConnection(providerConfigKey, connectionId) {
    const response = await fetch(
      `${this.baseUrl}/connection/${connectionId}?provider_config_key=${providerConfigKey}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${this.secretKey}`
        }
      }
    );
    if (!response.ok && response.status !== 404) {
      const error = await response.json().catch(() => ({}));
      throw new NangoError(
        error.message || `Failed to delete connection: ${response.status}`,
        response.status,
        error.code
      );
    }
  }
  /**
   * List all connections for a user
   */
  async listConnections(connectionIdPrefix) {
    const url = new URL(`${this.baseUrl}/connections`);
    if (connectionIdPrefix) {
      url.searchParams.set("connectionId", connectionIdPrefix);
    }
    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${this.secretKey}`
      }
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new NangoError(
        error.message || `Failed to list connections: ${response.status}`,
        response.status,
        error.code
      );
    }
    const data = await response.json();
    return data.connections || [];
  }
};
var nangoClient = null;
function getNangoClient() {
  if (!nangoClient) {
    nangoClient = new NangoClient();
  }
  return nangoClient;
}
__name(getNangoClient, "getNangoClient");
var PROVIDER_CONFIG_KEYS = {
  // ATS providers
  greenhouse: "greenhouse",
  lever: "lever",
  ashby: "ashby",
  workable: "workable",
  "zoho-recruit": "zoho-recruit",
  // Calendar providers
  "google-calendar": "google-calendar",
  "outlook-calendar": "outlook-calendar",
  calendly: "calendly",
  // Email providers
  gmail: "gmail",
  outlook: "outlook",
  // Generic mappings (for backwards compatibility)
  ats: "zoho-recruit",
  // Default ATS - using Zoho Recruit
  calendar: "google-calendar",
  // Default calendar
  email: "gmail"
  // Default email
};
function generateConnectionId(userId, provider) {
  return `${userId}:${provider}`;
}
__name(generateConnectionId, "generateConnectionId");

// apps/api/src/lib/skill-renderer.ts
var ATS_BASE_URLS = {
  greenhouse: "https://harvest.greenhouse.io/v1",
  lever: "https://api.lever.co/v1",
  ashby: "https://api.ashbyhq.com",
  workable: "https://www.workable.com/spi/v3"
};
var LLM_DEFAULTS = {
  anthropic: { model: "claude-sonnet-4-20250514" },
  openai: { model: "gpt-4o" },
  groq: { model: "llama-3.1-8b-instant" }
};
async function buildCapabilityProfile(userId) {
  const profile = {
    skillomaticApiUrl: process.env.SKILLOMATIC_API_URL || "http://localhost:3000"
  };
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) {
    return profile;
  }
  const [apiKey] = await db.select().from(apiKeys).where(and(eq(apiKeys.userId, userId), isNull(apiKeys.revokedAt))).limit(1);
  if (apiKey) {
    profile.skillomaticApiKey = apiKey.key;
  }
  if (user.organizationId) {
    const llmConfig = await getOrgLLMConfig(user.organizationId);
    if (llmConfig) {
      profile.llm = llmConfig;
    }
  }
  const userIntegrations = await db.select().from(integrations).where(and(eq(integrations.userId, userId), eq(integrations.status, "connected")));
  const nango = getNangoClient();
  for (const integration of userIntegrations) {
    if (!integration.nangoConnectionId) continue;
    const providerConfigKey = PROVIDER_CONFIG_KEYS[integration.provider] || integration.provider;
    const metadata = integration.metadata ? JSON.parse(integration.metadata) : {};
    try {
      const token = await nango.getToken(providerConfigKey, integration.nangoConnectionId);
      switch (integration.provider) {
        case "ats": {
          const atsProvider = metadata.subProvider || "greenhouse";
          profile.ats = {
            provider: atsProvider,
            token: token.access_token,
            baseUrl: ATS_BASE_URLS[atsProvider] || ATS_BASE_URLS.greenhouse
          };
          break;
        }
        case "calendar": {
          const calProvider = metadata.subProvider || "google-calendar";
          if (calProvider === "calendly") {
            profile.calendar = {
              ...profile.calendar,
              calendly: {
                token: token.access_token,
                userUri: token.raw.user_uri || "",
                schedulingUrl: token.raw.scheduling_url || ""
              }
            };
          }
          break;
        }
        case "email": {
          const emailProvider = metadata.subProvider || "gmail";
          profile.email = {
            provider: emailProvider,
            token: token.access_token
          };
          break;
        }
      }
    } catch (error) {
      console.warn(`Failed to fetch token for ${integration.provider}:`, error);
    }
  }
  return profile;
}
__name(buildCapabilityProfile, "buildCapabilityProfile");
async function getOrgLLMConfig(orgId) {
  const [org] = await db.select().from(organizations).where(eq(organizations.id, orgId)).limit(1);
  if (org?.llmApiKey) {
    const provider2 = org.llmProvider || "anthropic";
    return {
      provider: provider2,
      apiKey: org.llmApiKey,
      model: org.llmModel || LLM_DEFAULTS[provider2]?.model || "claude-sonnet-4-20250514"
    };
  }
  const [defaultProviderSetting] = await db.select().from(systemSettings).where(eq(systemSettings.key, "llm.default_provider")).limit(1);
  const provider = defaultProviderSetting?.value || "groq";
  const [apiKeySetting] = await db.select().from(systemSettings).where(eq(systemSettings.key, `llm.${provider}_api_key`)).limit(1);
  if (!apiKeySetting?.value) {
    const envKey = getEnvApiKey(provider);
    if (!envKey) return null;
    return {
      provider,
      apiKey: envKey,
      model: LLM_DEFAULTS[provider]?.model || "claude-sonnet-4-20250514"
    };
  }
  const [modelSetting] = await db.select().from(systemSettings).where(eq(systemSettings.key, "llm.default_model")).limit(1);
  return {
    provider,
    apiKey: apiKeySetting.value,
    model: modelSetting?.value || LLM_DEFAULTS[provider]?.model || "claude-sonnet-4-20250514"
  };
}
__name(getOrgLLMConfig, "getOrgLLMConfig");
function getEnvApiKey(provider) {
  switch (provider) {
    case "anthropic":
      return process.env.ANTHROPIC_API_KEY || null;
    case "openai":
      return process.env.OPENAI_API_KEY || null;
    case "groq":
      return process.env.GROQ_API_KEY || null;
    default:
      return null;
  }
}
__name(getEnvApiKey, "getEnvApiKey");
function checkCapabilityRequirements(requiredIntegrations, profile) {
  const missing = [];
  for (const req of requiredIntegrations) {
    switch (req) {
      case "ats":
        if (!profile.ats) missing.push("ATS (Greenhouse, Lever, etc.)");
        break;
      case "calendly":
        if (!profile.calendar?.calendly) missing.push("Calendly");
        break;
      case "calendar":
        if (!profile.calendar?.ical && !profile.calendar?.calendly) {
          missing.push("Calendar (iCal or Calendly)");
        }
        break;
      case "email-read":
        if (!profile.email) missing.push("Email (Gmail or Outlook)");
        break;
      case "llm":
        if (!profile.llm) missing.push("LLM API Key");
        break;
    }
  }
  return {
    satisfied: missing.length === 0,
    missing
  };
}
__name(checkCapabilityRequirements, "checkCapabilityRequirements");
function renderSkillInstructions(instructions, profile) {
  const replacements = {
    // Core
    "{{SKILLOMATIC_API_URL}}": profile.skillomaticApiUrl,
    "{{SKILLOMATIC_API_KEY}}": profile.skillomaticApiKey || "[API_KEY_NOT_CONFIGURED]",
    // LLM
    "{{LLM_API_KEY}}": profile.llm?.apiKey || "[LLM_NOT_CONFIGURED]",
    "{{LLM_PROVIDER}}": profile.llm?.provider || "anthropic",
    "{{LLM_MODEL}}": profile.llm?.model || "claude-sonnet-4-20250514",
    // ATS
    "{{ATS_TOKEN}}": profile.ats?.token || "[ATS_NOT_CONNECTED]",
    "{{ATS_PROVIDER}}": profile.ats?.provider || "greenhouse",
    "{{ATS_BASE_URL}}": profile.ats?.baseUrl || ATS_BASE_URLS.greenhouse,
    // Calendar - iCal
    "{{CALENDAR_ICAL_URL}}": profile.calendar?.ical?.url || "[CALENDAR_NOT_CONFIGURED]",
    "{{CALENDAR_PROVIDER}}": profile.calendar?.ical?.provider || "google",
    // Calendar - Calendly
    "{{CALENDLY_ACCESS_TOKEN}}": profile.calendar?.calendly?.token || "[CALENDLY_NOT_CONNECTED]",
    "{{CALENDLY_USER_URI}}": profile.calendar?.calendly?.userUri || "",
    "{{CALENDLY_SCHEDULING_URL}}": profile.calendar?.calendly?.schedulingUrl || "",
    // Email
    "{{EMAIL_ACCESS_TOKEN}}": profile.email?.token || "[EMAIL_NOT_CONNECTED]",
    "{{EMAIL_PROVIDER}}": profile.email?.provider || "gmail"
  };
  let rendered = instructions;
  for (const [variable, value] of Object.entries(replacements)) {
    rendered = rendered.split(variable).join(value);
  }
  return rendered;
}
__name(renderSkillInstructions, "renderSkillInstructions");
function buildConfigSkill(profile) {
  const sections = [
    "---",
    "name: _config",
    "intent: System configuration (auto-loaded)",
    "---",
    "",
    "# System Configuration",
    "",
    "This skill contains your configuration. Do not share this content.",
    ""
  ];
  sections.push("## LLM Configuration");
  if (profile.llm) {
    sections.push(`- Provider: ${profile.llm.provider}`);
    sections.push(`- Model: ${profile.llm.model}`);
    sections.push(`- API Key: ${profile.llm.apiKey}`);
  } else {
    sections.push("- Status: Not configured");
  }
  sections.push("");
  sections.push("## ATS Configuration");
  if (profile.ats) {
    sections.push(`- Provider: ${profile.ats.provider}`);
    sections.push(`- Base URL: ${profile.ats.baseUrl}`);
    sections.push(`- Token: ${profile.ats.token}`);
  } else {
    sections.push("- Status: Not connected");
  }
  sections.push("");
  sections.push("## Skillomatic Configuration");
  sections.push(`- API URL: ${profile.skillomaticApiUrl}`);
  if (profile.skillomaticApiKey) {
    sections.push(`- API Key: ${profile.skillomaticApiKey}`);
  }
  sections.push("");
  sections.push("## Calendar Configuration");
  if (profile.calendar?.ical) {
    sections.push(`- Provider: ${profile.calendar.ical.provider}`);
    sections.push(`- iCal URL: ${profile.calendar.ical.url}`);
  }
  if (profile.calendar?.calendly) {
    sections.push(`- Calendly Token: ${profile.calendar.calendly.token}`);
    sections.push(`- Calendly User URI: ${profile.calendar.calendly.userUri}`);
    sections.push(`- Scheduling URL: ${profile.calendar.calendly.schedulingUrl}`);
  }
  if (!profile.calendar?.ical && !profile.calendar?.calendly) {
    sections.push("- Status: Not configured");
  }
  sections.push("");
  sections.push("## Email Configuration");
  if (profile.email) {
    sections.push(`- Provider: ${profile.email.provider}`);
    sections.push(`- Access Token: ${profile.email.token}`);
  } else {
    sections.push("- Status: Not connected (mailto: always available)");
  }
  return sections.join("\n");
}
__name(buildConfigSkill, "buildConfigSkill");

// apps/api/src/routes/skills.ts
var skillsRoutes = new Hono2();
skillsRoutes.get("/install.sh", async (c) => {
  const host = c.req.header("host") || "localhost:3000";
  const protocol = c.req.header("x-forwarded-proto") || "http";
  const baseUrl = `${protocol}://${host}`;
  const enabledSkills = await db.select().from(skills).where(eq(skills.isEnabled, true));
  const skillDownloads = enabledSkills.map((s) => `  echo "  - ${s.name}"
  curl -sf "${baseUrl}/api/skills/${s.slug}/download" -o "${s.slug}.md"`).join("\n");
  const script = `#!/bin/bash
# Skillomatic Skills Installer
# This script downloads Claude Code skills from your Skillomatic instance.
# Review this script before running: cat install-skillomatic.sh

set -e

SKILLS_DIR="\${HOME}/.claude/commands"

echo "Installing Skillomatic skills to \${SKILLS_DIR}"
echo ""

mkdir -p "\${SKILLS_DIR}"
cd "\${SKILLS_DIR}"

echo "Downloading ${enabledSkills.length} skills..."
${skillDownloads}

echo ""
echo "Done! Skills installed to \${SKILLS_DIR}"
echo ""
echo "Next steps:"
echo "  1. Make sure SKILLOMATIC_API_KEY is set in your shell profile"
echo "  2. Run: source ~/.zshrc (or ~/.bashrc)"
echo "  3. Open Claude Code and try: /ats-search"
`;
  return new Response(script, {
    headers: {
      "Content-Type": "text/plain",
      "Content-Disposition": 'attachment; filename="install-skillomatic.sh"'
    }
  });
});
skillsRoutes.get("/:slug/download", async (c) => {
  const slug = c.req.param("slug");
  const [skill] = await db.select().from(skills).where(eq(skills.slug, slug)).limit(1);
  if (!skill) {
    return c.json({ error: { message: "Skill not found" } }, 404);
  }
  if (!skill.instructions) {
    return c.json({ error: { message: "Skill instructions not found" } }, 404);
  }
  const frontmatter = [
    "---",
    `name: ${skill.slug}`,
    `description: ${skill.description}`,
    skill.intent ? `intent: ${skill.intent}` : null,
    skill.capabilities ? `capabilities:
${JSON.parse(skill.capabilities).map((c2) => `  - ${c2}`).join("\n")}` : null,
    "---"
  ].filter(Boolean).join("\n");
  const content = `${frontmatter}

${skill.instructions}`;
  return new Response(content, {
    headers: {
      "Content-Type": "text/markdown",
      "Content-Disposition": `attachment; filename="${slug}.md"`
    }
  });
});
skillsRoutes.use("*", combinedAuth);
function toSkillPublic(skill) {
  return {
    id: skill.id,
    slug: skill.slug,
    name: skill.name,
    description: skill.description,
    category: skill.category,
    version: skill.version,
    requiredIntegrations: skill.requiredIntegrations ? JSON.parse(skill.requiredIntegrations) : [],
    requiredScopes: [],
    intent: skill.intent || "",
    capabilities: skill.capabilities ? JSON.parse(skill.capabilities) : [],
    isEnabled: skill.isEnabled
  };
}
__name(toSkillPublic, "toSkillPublic");
skillsRoutes.get("/", async (c) => {
  const user = c.get("user");
  const organizationId = user.organizationId;
  let allSkills;
  if (organizationId) {
    allSkills = await db.select().from(skills).where(
      or(
        eq(skills.isGlobal, true),
        eq(skills.organizationId, organizationId)
      )
    );
  } else {
    allSkills = await db.select().from(skills).where(eq(skills.isGlobal, true));
  }
  const filteredSkills = user.isAdmin ? allSkills : allSkills.filter((s) => s.isEnabled);
  const publicSkills = filteredSkills.map(toSkillPublic);
  return c.json({ data: publicSkills });
});
skillsRoutes.get("/config", async (c) => {
  const user = c.get("user");
  const profile = await buildCapabilityProfile(user.sub);
  const configContent = buildConfigSkill(profile);
  return c.json({
    data: {
      slug: "_config",
      name: "System Configuration",
      rendered: true,
      instructions: configContent,
      profile: {
        hasLLM: !!profile.llm,
        hasATS: !!profile.ats,
        hasCalendar: !!(profile.calendar?.ical || profile.calendar?.calendly),
        hasEmail: !!profile.email,
        llmProvider: profile.llm?.provider,
        atsProvider: profile.ats?.provider
      }
    }
  });
});
function canAccessSkill(skill, user) {
  if (skill.isGlobal) return true;
  if (skill.organizationId && user.organizationId === skill.organizationId) return true;
  return false;
}
__name(canAccessSkill, "canAccessSkill");
skillsRoutes.get("/:slug", async (c) => {
  const slug = c.req.param("slug");
  const user = c.get("user");
  const [skill] = await db.select().from(skills).where(eq(skills.slug, slug)).limit(1);
  if (!skill) {
    return c.json({ error: { message: "Skill not found" } }, 404);
  }
  if (!canAccessSkill(skill, user)) {
    return c.json({ error: { message: "Skill not found" } }, 404);
  }
  if (!skill.isEnabled && !user.isAdmin) {
    return c.json({ error: { message: "Skill not found" } }, 404);
  }
  return c.json({ data: toSkillPublic(skill) });
});
skillsRoutes.get("/:slug/rendered", async (c) => {
  const slug = c.req.param("slug");
  const user = c.get("user");
  if (slug === "_config") {
    const profile2 = await buildCapabilityProfile(user.sub);
    const configContent = buildConfigSkill(profile2);
    return c.json({
      data: {
        slug: "_config",
        name: "System Configuration",
        rendered: true,
        instructions: configContent
      }
    });
  }
  const [skill] = await db.select().from(skills).where(eq(skills.slug, slug)).limit(1);
  if (!skill) {
    return c.json({ error: { message: "Skill not found" } }, 404);
  }
  if (!canAccessSkill(skill, user)) {
    return c.json({ error: { message: "Skill not found" } }, 404);
  }
  if (!skill.isEnabled && !user.isAdmin) {
    return c.json({ error: { message: "Skill is disabled" } }, 403);
  }
  if (!skill.instructions) {
    return c.json({ error: { message: "Skill has no instructions" } }, 400);
  }
  const profile = await buildCapabilityProfile(user.sub);
  const requiredIntegrations = skill.requiredIntegrations ? JSON.parse(skill.requiredIntegrations) : [];
  const capabilityCheck = checkCapabilityRequirements(requiredIntegrations, profile);
  if (!capabilityCheck.satisfied) {
    return c.json(
      {
        error: {
          message: `This skill requires: ${capabilityCheck.missing.join(", ")}. Please connect these integrations in Settings.`,
          code: "MISSING_CAPABILITIES",
          missing: capabilityCheck.missing
        }
      },
      400
    );
  }
  const renderedInstructions = renderSkillInstructions(skill.instructions, profile);
  return c.json({
    data: {
      ...toSkillPublic(skill),
      rendered: true,
      instructions: renderedInstructions
    }
  });
});
skillsRoutes.put("/:slug", async (c) => {
  const user = c.get("user");
  if (!user.isAdmin) {
    return c.json({ error: { message: "Admin access required" } }, 403);
  }
  const slug = c.req.param("slug");
  const body = await c.req.json();
  const [existingSkill] = await db.select().from(skills).where(eq(skills.slug, slug)).limit(1);
  if (!existingSkill) {
    return c.json({ error: { message: "Skill not found" } }, 404);
  }
  const updates = {};
  if (body.name !== void 0) updates.name = body.name;
  if (body.description !== void 0) updates.description = body.description;
  if (body.category !== void 0) updates.category = body.category;
  if (body.intent !== void 0) updates.intent = body.intent;
  if (body.capabilities !== void 0) updates.capabilities = JSON.stringify(body.capabilities);
  if (body.requiredIntegrations !== void 0) updates.requiredIntegrations = JSON.stringify(body.requiredIntegrations);
  if (body.isEnabled !== void 0) updates.isEnabled = body.isEnabled;
  const [updatedSkill] = await db.update(skills).set(updates).where(eq(skills.id, existingSkill.id)).returning();
  return c.json({ data: toSkillPublic(updatedSkill) });
});

// apps/api/src/routes/api-keys.ts
import { randomUUID } from "crypto";

// apps/api/src/middleware/auth.ts
var jwtAuth = createMiddleware(async (c, next) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: { message: "Missing or invalid Authorization header" } }, 401);
  }
  const token = authHeader.slice(7);
  const payload = await verifyToken(token);
  if (!payload) {
    return c.json({ error: { message: "Invalid or expired token" } }, 401);
  }
  c.set("user", payload);
  await next();
});
var adminOnly = createMiddleware(async (c, next) => {
  const user = c.get("user");
  if (!user?.isAdmin && !user?.isSuperAdmin) {
    return c.json({ error: { message: "Admin access required" } }, 403);
  }
  await next();
});
var superAdminOnly = createMiddleware(async (c, next) => {
  const user = c.get("user");
  if (!user?.isSuperAdmin) {
    return c.json({ error: { message: "Super admin access required" } }, 403);
  }
  await next();
});
var orgAdminOnly = createMiddleware(async (c, next) => {
  const user = c.get("user");
  if (!user?.isAdmin && !user?.isSuperAdmin) {
    return c.json({ error: { message: "Organization admin access required" } }, 403);
  }
  await next();
});

// apps/api/src/lib/api-keys.ts
import { randomBytes } from "crypto";
var API_KEY_PREFIX = "sk_live_";
var API_KEY_LENGTH = 32;
function generateApiKey() {
  const randomPart = randomBytes(API_KEY_LENGTH).toString("hex");
  return `${API_KEY_PREFIX}${randomPart}`;
}
__name(generateApiKey, "generateApiKey");
function extractApiKey(authHeader) {
  if (!authHeader) return null;
  if (authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  if (authHeader.startsWith(API_KEY_PREFIX)) {
    return authHeader;
  }
  return null;
}
__name(extractApiKey, "extractApiKey");
async function validateApiKey(key) {
  if (!key || !key.startsWith(API_KEY_PREFIX)) {
    return null;
  }
  const result = await db.select().from(apiKeys).innerJoin(users, eq(apiKeys.userId, users.id)).where(
    and(
      eq(apiKeys.key, key),
      isNull(apiKeys.revokedAt)
    )
  ).limit(1);
  if (result.length === 0) {
    return null;
  }
  const row = result[0];
  const apiKey = row.api_keys;
  const user = row.users;
  db.update(apiKeys).set({ lastUsedAt: /* @__PURE__ */ new Date() }).where(eq(apiKeys.id, apiKey.id)).execute().catch(console.error);
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    isAdmin: user.isAdmin,
    apiKeyId: apiKey.id,
    organizationId: user.organizationId,
    onboardingStep: user.onboardingStep ?? 0
  };
}
__name(validateApiKey, "validateApiKey");

// apps/api/src/routes/api-keys.ts
var apiKeysRoutes = new Hono2();
apiKeysRoutes.use("*", jwtAuth);
apiKeysRoutes.get("/", async (c) => {
  const user = c.get("user");
  const keys = await db.select().from(apiKeys).where(
    and(
      eq(apiKeys.userId, user.sub),
      isNull(apiKeys.revokedAt)
    )
  );
  const publicKeys = keys.map((k2) => ({
    id: k2.id,
    name: k2.name,
    key: k2.key,
    // Full key always visible
    lastUsedAt: k2.lastUsedAt ?? void 0,
    createdAt: k2.createdAt
  }));
  return c.json({ data: publicKeys });
});
apiKeysRoutes.post("/", async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  const name = body.name || "API Key";
  const key = generateApiKey();
  const id = randomUUID();
  await db.insert(apiKeys).values({
    id,
    userId: user.sub,
    organizationId: user.organizationId ?? null,
    // Add org context
    key,
    name
  });
  if (user.organizationId) {
    const [org] = await db.select().from(organizations).where(eq(organizations.id, user.organizationId)).limit(1);
    if (org?.desktopEnabled) {
      const [dbUser] = await db.select().from(users).where(eq(users.id, user.sub)).limit(1);
      if (dbUser && dbUser.onboardingStep < ONBOARDING_STEPS.API_KEY_GENERATED) {
        await db.update(users).set({
          onboardingStep: ONBOARDING_STEPS.API_KEY_GENERATED,
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq(users.id, user.sub));
      }
    }
  }
  const response = {
    id,
    name,
    key,
    createdAt: /* @__PURE__ */ new Date()
  };
  return c.json({ data: response }, 201);
});
apiKeysRoutes.delete("/:id", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  const key = await db.select().from(apiKeys).where(
    and(
      eq(apiKeys.id, id),
      eq(apiKeys.userId, user.sub),
      isNull(apiKeys.revokedAt)
    )
  ).limit(1);
  if (key.length === 0) {
    return c.json({ error: { message: "API key not found" } }, 404);
  }
  await db.update(apiKeys).set({ revokedAt: /* @__PURE__ */ new Date() }).where(eq(apiKeys.id, id));
  return c.json({ data: { message: "API key revoked" } });
});

// apps/api/src/routes/integrations.ts
import { randomUUID as randomUUID2 } from "crypto";
var integrationsRoutes = new Hono2();
integrationsRoutes.use("*", jwtAuth);
integrationsRoutes.get("/", async (c) => {
  const user = c.get("user");
  const userIntegrations = await db.select().from(integrations).where(eq(integrations.userId, user.sub));
  const publicIntegrations = userIntegrations.map((int) => ({
    id: int.id,
    provider: int.provider,
    status: int.status,
    lastSyncAt: int.lastSyncAt ?? void 0,
    createdAt: int.createdAt
  }));
  return c.json({ data: publicIntegrations });
});
integrationsRoutes.post("/session", async (c) => {
  const user = c.get("user");
  const body = await c.req.json().catch(() => ({}));
  try {
    const nango = getNangoClient();
    const session = await nango.createConnectSession({
      userId: user.sub,
      userEmail: user.email,
      allowedIntegrations: body.allowedIntegrations
    });
    return c.json({
      data: {
        token: session.token,
        expiresAt: session.expiresAt,
        connectLink: session.connectLink
      }
    });
  } catch (error) {
    if (error instanceof NangoError) {
      const statusCode = error.statusCode || 500;
      return c.json(
        { error: { message: error.message, code: error.code } },
        statusCode
      );
    }
    throw error;
  }
});
integrationsRoutes.post("/connect", async (c) => {
  const body = await c.req.json();
  const user = c.get("user");
  if (!body.provider) {
    return c.json({ error: { message: "Provider is required" } }, 400);
  }
  const providerKey = body.subProvider || body.provider;
  const providerConfigKey = PROVIDER_CONFIG_KEYS[providerKey];
  if (!providerConfigKey) {
    return c.json(
      {
        error: {
          message: `Unknown provider: ${providerKey}. Supported: ${Object.keys(PROVIDER_CONFIG_KEYS).join(", ")}`
        }
      },
      400
    );
  }
  const connectionId = generateConnectionId(user.sub, body.provider);
  const apiUrl = process.env.SKILLOMATIC_API_URL || "http://localhost:3000";
  const callbackUrl = `${apiUrl}/api/integrations/callback`;
  const nango = getNangoClient();
  const oauthUrl = nango.getConnectUrl(providerConfigKey, connectionId, callbackUrl);
  const existingIntegration = await db.select().from(integrations).where(and(eq(integrations.userId, user.sub), eq(integrations.provider, body.provider))).limit(1);
  if (existingIntegration.length === 0) {
    await db.insert(integrations).values({
      id: randomUUID2(),
      userId: user.sub,
      organizationId: user.organizationId,
      provider: body.provider,
      nangoConnectionId: connectionId,
      status: "pending",
      metadata: JSON.stringify({ subProvider: body.subProvider }),
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    });
  } else {
    await db.update(integrations).set({
      nangoConnectionId: connectionId,
      status: "pending",
      metadata: JSON.stringify({ subProvider: body.subProvider }),
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(integrations.id, existingIntegration[0].id));
  }
  return c.json({
    data: {
      url: oauthUrl,
      connectionId,
      message: "Redirect user to this URL to complete OAuth"
    }
  });
});
integrationsRoutes.get("/callback", async (c) => {
  const connectionId = c.req.query("connection_id");
  const error = c.req.query("error");
  const errorDescription = c.req.query("error_description");
  const webUrl = process.env.WEB_URL || "http://localhost:5173";
  if (error) {
    const errorUrl = new URL(`${webUrl}/integrations`);
    errorUrl.searchParams.set("error", errorDescription || error);
    return c.redirect(errorUrl.toString());
  }
  if (!connectionId) {
    const errorUrl = new URL(`${webUrl}/integrations`);
    errorUrl.searchParams.set("error", "Missing connection ID");
    return c.redirect(errorUrl.toString());
  }
  const integration = await db.select().from(integrations).where(eq(integrations.nangoConnectionId, connectionId)).limit(1);
  if (integration.length > 0) {
    await db.update(integrations).set({
      status: "connected",
      lastSyncAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(integrations.id, integration[0].id));
    const userId = integration[0].userId;
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (user && user.onboardingStep < ONBOARDING_STEPS.ATS_CONNECTED) {
      await db.update(users).set({
        onboardingStep: ONBOARDING_STEPS.ATS_CONNECTED,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(users.id, userId));
    }
  }
  const successUrl = new URL(`${webUrl}/integrations`);
  successUrl.searchParams.set("success", "Integration connected successfully");
  return c.redirect(successUrl.toString());
});
integrationsRoutes.post("/disconnect", async (c) => {
  const body = await c.req.json();
  const user = c.get("user");
  if (!body.integrationId) {
    return c.json({ error: { message: "Integration ID is required" } }, 400);
  }
  const integration = await db.select().from(integrations).where(and(eq(integrations.id, body.integrationId), eq(integrations.userId, user.sub))).limit(1);
  if (integration.length === 0) {
    return c.json({ error: { message: "Integration not found" } }, 404);
  }
  const int = integration[0];
  if (int.nangoConnectionId) {
    try {
      const nango = getNangoClient();
      const providerConfigKey = PROVIDER_CONFIG_KEYS[int.provider] || int.provider;
      await nango.deleteConnection(providerConfigKey, int.nangoConnectionId);
    } catch (error) {
      console.warn(`Failed to delete Nango connection: ${error}`);
    }
  }
  await db.update(integrations).set({
    status: "disconnected",
    nangoConnectionId: null,
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq(integrations.id, body.integrationId));
  return c.json({ data: { message: "Integration disconnected" } });
});
integrationsRoutes.get("/:id/token", async (c) => {
  const user = c.get("user");
  const integrationId = c.req.param("id");
  const integration = await db.select().from(integrations).where(and(eq(integrations.id, integrationId), eq(integrations.userId, user.sub))).limit(1);
  if (integration.length === 0) {
    return c.json({ error: { message: "Integration not found" } }, 404);
  }
  const int = integration[0];
  if (int.status !== "connected") {
    return c.json({ error: { message: "Integration is not connected" } }, 400);
  }
  if (!int.nangoConnectionId) {
    return c.json({ error: { message: "No Nango connection for this integration" } }, 400);
  }
  try {
    const nango = getNangoClient();
    const providerConfigKey = PROVIDER_CONFIG_KEYS[int.provider] || int.provider;
    const token = await nango.getToken(providerConfigKey, int.nangoConnectionId);
    await db.update(integrations).set({ lastSyncAt: /* @__PURE__ */ new Date(), updatedAt: /* @__PURE__ */ new Date() }).where(eq(integrations.id, integrationId));
    return c.json({
      data: {
        accessToken: token.access_token,
        tokenType: token.token_type,
        expiresAt: token.expires_at
      }
    });
  } catch (error) {
    if (error instanceof NangoError) {
      await db.update(integrations).set({ status: "error", updatedAt: /* @__PURE__ */ new Date() }).where(eq(integrations.id, integrationId));
      const statusCode = error.statusCode || 500;
      return c.json(
        {
          error: {
            message: `Failed to get token: ${error.message}`,
            code: error.code
          }
        },
        statusCode
      );
    }
    throw error;
  }
});
integrationsRoutes.get("/status/:provider", async (c) => {
  const user = c.get("user");
  const provider = c.req.param("provider");
  const integration = await db.select().from(integrations).where(and(eq(integrations.userId, user.sub), eq(integrations.provider, provider))).limit(1);
  if (integration.length === 0) {
    return c.json({
      data: {
        connected: false,
        status: "not_configured"
      }
    });
  }
  const int = integration[0];
  if (int.status === "connected" && int.nangoConnectionId) {
    try {
      const nango = getNangoClient();
      const providerConfigKey = PROVIDER_CONFIG_KEYS[int.provider] || int.provider;
      const connection = await nango.getConnection(providerConfigKey, int.nangoConnectionId);
      if (!connection) {
        await db.update(integrations).set({ status: "disconnected", updatedAt: /* @__PURE__ */ new Date() }).where(eq(integrations.id, int.id));
        return c.json({
          data: {
            connected: false,
            status: "disconnected",
            message: "Connection was revoked"
          }
        });
      }
    } catch {
    }
  }
  return c.json({
    data: {
      connected: int.status === "connected",
      status: int.status,
      lastSyncAt: int.lastSyncAt
    }
  });
});

// apps/api/src/routes/users.ts
import { randomUUID as randomUUID3 } from "crypto";

// apps/api/src/middleware/organization.ts
var withOrganization = createMiddleware(async (c, next) => {
  const user = c.get("user");
  if (user?.organizationId) {
    const [org] = await db.select().from(organizations).where(eq(organizations.id, user.organizationId)).limit(1);
    c.set("organization", org ? { id: org.id, name: org.name, slug: org.slug } : null);
  } else {
    c.set("organization", null);
  }
  await next();
});
var requireOrganization = createMiddleware(async (c, next) => {
  const org = c.get("organization");
  if (!org) {
    return c.json(
      { error: { message: "Organization context required" } },
      403
    );
  }
  await next();
});
var withOrganizationFromApiKey = createMiddleware(async (c, next) => {
  const apiKeyUser = c.get("apiKeyUser");
  if (apiKeyUser?.organizationId) {
    const [org] = await db.select().from(organizations).where(eq(organizations.id, apiKeyUser.organizationId)).limit(1);
    c.set("organization", org ? { id: org.id, name: org.name, slug: org.slug } : null);
  } else {
    c.set("organization", null);
  }
  await next();
});

// apps/api/src/routes/users.ts
var usersRoutes = new Hono2();
usersRoutes.use("*", jwtAuth);
usersRoutes.use("*", adminOnly);
usersRoutes.use("*", withOrganization);
usersRoutes.get("/", async (c) => {
  const currentUser = c.get("user");
  const org = c.get("organization");
  let allUsersWithOrg;
  if (currentUser.isSuperAdmin) {
    allUsersWithOrg = await db.select().from(users).leftJoin(organizations, eq(users.organizationId, organizations.id));
  } else if (org) {
    allUsersWithOrg = await db.select().from(users).leftJoin(organizations, eq(users.organizationId, organizations.id)).where(eq(users.organizationId, org.id));
  } else {
    return c.json({ data: [] });
  }
  const publicUsers = allUsersWithOrg.map((row) => ({
    id: row.users.id,
    email: row.users.email,
    name: row.users.name,
    avatarUrl: row.users.avatarUrl ?? void 0,
    isAdmin: row.users.isAdmin,
    isSuperAdmin: row.users.isSuperAdmin ?? false,
    organizationId: row.users.organizationId ?? void 0,
    organizationName: row.organizations?.name ?? void 0,
    onboardingStep: row.users.onboardingStep ?? 0
  }));
  return c.json({ data: publicUsers });
});
usersRoutes.get("/:id", async (c) => {
  const id = c.req.param("id");
  const currentUser = c.get("user");
  const org = c.get("organization");
  const result = await db.select().from(users).leftJoin(organizations, eq(users.organizationId, organizations.id)).where(eq(users.id, id)).limit(1);
  if (result.length === 0) {
    return c.json({ error: { message: "User not found" } }, 404);
  }
  const row = result[0];
  const user = row.users;
  const orgData = row.organizations;
  if (!currentUser.isSuperAdmin && user.organizationId !== org?.id) {
    return c.json({ error: { message: "Forbidden" } }, 403);
  }
  const publicUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl ?? void 0,
    isAdmin: user.isAdmin,
    isSuperAdmin: user.isSuperAdmin ?? false,
    organizationId: user.organizationId ?? void 0,
    organizationName: orgData?.name ?? void 0,
    onboardingStep: user.onboardingStep ?? 0
  };
  return c.json({ data: publicUser });
});
usersRoutes.post("/", async (c) => {
  const currentUser = c.get("user");
  const org = c.get("organization");
  const body = await c.req.json();
  if (!body.email || !body.password || !body.name) {
    return c.json({ error: { message: "Email, password, and name are required" } }, 400);
  }
  let targetOrgId = body.organizationId;
  if (!currentUser.isSuperAdmin) {
    if (!org) {
      return c.json({ error: { message: "No organization assigned" } }, 400);
    }
    targetOrgId = org.id;
  }
  if (!targetOrgId) {
    return c.json({ error: { message: "Organization ID required" } }, 400);
  }
  const existing = await db.select().from(users).where(eq(users.email, body.email.toLowerCase())).limit(1);
  if (existing.length > 0) {
    return c.json({ error: { message: "Email already exists" } }, 400);
  }
  const [targetOrg] = await db.select().from(organizations).where(eq(organizations.id, targetOrgId)).limit(1);
  if (!targetOrg) {
    return c.json({ error: { message: "Organization not found" } }, 404);
  }
  const id = randomUUID3();
  const passwordHash = R(body.password, 10);
  await db.insert(users).values({
    id,
    email: body.email.toLowerCase(),
    passwordHash,
    name: body.name,
    isAdmin: body.isAdmin ?? false,
    isSuperAdmin: false,
    // Only super admins can create super admins via direct DB
    organizationId: targetOrgId
  });
  const publicUser = {
    id,
    email: body.email.toLowerCase(),
    name: body.name,
    isAdmin: body.isAdmin ?? false,
    isSuperAdmin: false,
    organizationId: targetOrgId,
    organizationName: targetOrg.name,
    onboardingStep: 0
  };
  return c.json({ data: publicUser }, 201);
});
usersRoutes.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const currentUser = c.get("user");
  const org = c.get("organization");
  if (id === currentUser.sub) {
    return c.json({ error: { message: "Cannot delete yourself" } }, 400);
  }
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!user) {
    return c.json({ error: { message: "User not found" } }, 404);
  }
  if (!currentUser.isSuperAdmin && user.organizationId !== org?.id) {
    return c.json({ error: { message: "Forbidden" } }, 403);
  }
  if (user.isSuperAdmin && !currentUser.isSuperAdmin) {
    return c.json({ error: { message: "Cannot delete super admin" } }, 403);
  }
  await db.delete(users).where(eq(users.id, id));
  return c.json({ data: { message: "User deleted" } });
});

// apps/api/src/lib/demo-data.ts
function generateDemoCandidates() {
  const now = /* @__PURE__ */ new Date();
  const today = now.toISOString().split("T")[0];
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1e3).toISOString().split("T")[0];
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1e3).toISOString().split("T")[0];
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1e3).toISOString().split("T")[0];
  const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1e3).toISOString().split("T")[0];
  return [
    {
      id: "demo-cand-1",
      firstName: "Sarah",
      lastName: "Chen",
      email: "sarah.chen@example.com",
      phone: "+1 (415) 555-0123",
      title: "Senior Software Engineer",
      company: "Stripe",
      location: "San Francisco, CA",
      linkedinUrl: "https://linkedin.com/in/sarahchen",
      skills: ["Python", "Go", "Kubernetes", "PostgreSQL", "AWS"],
      experience: 7,
      source: "LinkedIn",
      status: "active",
      stage: "Interview",
      notes: "Strong backend experience. 2nd round scheduled for Friday.",
      createdAt: today,
      updatedAt: today
    },
    {
      id: "demo-cand-2",
      firstName: "Marcus",
      lastName: "Johnson",
      email: "marcus.j@example.com",
      phone: "+1 (650) 555-0456",
      title: "Staff Engineer",
      company: "Meta",
      location: "Menlo Park, CA",
      linkedinUrl: "https://linkedin.com/in/marcusjohnson",
      skills: ["React", "TypeScript", "GraphQL", "Node.js", "System Design"],
      experience: 10,
      source: "Referral",
      status: "active",
      stage: "Offer",
      notes: "Excellent systems background. Verbal offer extended, awaiting response.",
      createdAt: twoDaysAgo,
      updatedAt: today
    },
    {
      id: "demo-cand-3",
      firstName: "Emily",
      lastName: "Rodriguez",
      email: "emily.rod@example.com",
      phone: "+1 (510) 555-0789",
      title: "Engineering Manager",
      company: "Airbnb",
      location: "San Francisco, CA",
      linkedinUrl: "https://linkedin.com/in/emilyrodriguez",
      skills: ["Leadership", "Agile", "Python", "Microservices", "Team Building"],
      experience: 12,
      source: "LinkedIn",
      status: "active",
      stage: "Screening",
      notes: "Looking for IC to manager transition candidates. Strong technical background.",
      createdAt: yesterday,
      updatedAt: yesterday
    },
    {
      id: "demo-cand-4",
      firstName: "David",
      lastName: "Kim",
      email: "david.kim@example.com",
      phone: "+1 (408) 555-0321",
      title: "Backend Developer",
      company: "Uber",
      location: "San Jose, CA",
      linkedinUrl: "https://linkedin.com/in/davidkim",
      skills: ["Java", "Spring Boot", "Kafka", "MySQL", "Docker"],
      experience: 5,
      source: "Job Board",
      status: "active",
      stage: "New",
      notes: "Applied through careers page. Resume looks promising.",
      createdAt: today,
      updatedAt: today
    },
    {
      id: "demo-cand-5",
      firstName: "Lisa",
      lastName: "Wang",
      email: "lisa.wang@example.com",
      phone: "+1 (925) 555-0654",
      title: "Full Stack Developer",
      company: "Salesforce",
      location: "Remote",
      linkedinUrl: "https://linkedin.com/in/lisawang",
      skills: ["JavaScript", "React", "Node.js", "MongoDB", "AWS"],
      experience: 4,
      source: "LinkedIn",
      status: "active",
      stage: "Interview",
      notes: "Good culture fit. Technical screen went well.",
      createdAt: threeDaysAgo,
      updatedAt: yesterday
    },
    {
      id: "demo-cand-6",
      firstName: "Alex",
      lastName: "Thompson",
      email: "alex.t@example.com",
      phone: "+1 (415) 555-0987",
      title: "DevOps Engineer",
      company: "Netflix",
      location: "Los Gatos, CA",
      linkedinUrl: "https://linkedin.com/in/alexthompson",
      skills: ["Terraform", "AWS", "Kubernetes", "CI/CD", "Python"],
      experience: 6,
      source: "Referral",
      status: "active",
      stage: "Screening",
      notes: "Referred by current team member. Strong DevOps background.",
      createdAt: today,
      updatedAt: today
    },
    {
      id: "demo-cand-7",
      firstName: "Rachel",
      lastName: "Martinez",
      email: "rachel.m@example.com",
      phone: "+1 (650) 555-0147",
      title: "Data Engineer",
      company: "Databricks",
      location: "San Francisco, CA",
      linkedinUrl: "https://linkedin.com/in/rachelmartinez",
      skills: ["Spark", "Python", "SQL", "Airflow", "Snowflake"],
      experience: 5,
      source: "LinkedIn",
      status: "rejected",
      stage: "Rejected",
      notes: "Good skills but looking for more senior role than we have open.",
      createdAt: lastWeek,
      updatedAt: twoDaysAgo
    },
    {
      id: "demo-cand-8",
      firstName: "James",
      lastName: "Wilson",
      email: "james.w@example.com",
      phone: "+1 (510) 555-0258",
      title: "Senior Frontend Engineer",
      company: "Twitter",
      location: "San Francisco, CA",
      linkedinUrl: "https://linkedin.com/in/jameswilson",
      skills: ["React", "TypeScript", "CSS", "Performance", "Accessibility"],
      experience: 8,
      source: "LinkedIn",
      status: "hired",
      stage: "Hired",
      notes: "Accepted offer! Start date: Next Monday.",
      createdAt: lastWeek,
      updatedAt: yesterday
    }
  ];
}
__name(generateDemoCandidates, "generateDemoCandidates");
function generateDemoJobs() {
  return [
    {
      id: "demo-job-1",
      title: "Senior Software Engineer",
      department: "Engineering",
      location: "San Francisco, CA",
      type: "Full-time",
      status: "open",
      description: "Looking for a senior engineer to join our platform team.",
      requirements: ["5+ years experience", "Python or Go", "Distributed systems"],
      salary: { min: 18e4, max: 22e4 },
      hiringManager: "Jane Smith",
      openings: 2,
      applicants: 15,
      createdAt: "2024-01-01"
    },
    {
      id: "demo-job-2",
      title: "Engineering Manager",
      department: "Engineering",
      location: "San Francisco, CA",
      type: "Full-time",
      status: "open",
      description: "Seeking an experienced engineering manager for our growth team.",
      requirements: ["8+ years experience", "3+ years management", "Technical background"],
      salary: { min: 22e4, max: 28e4 },
      hiringManager: "Bob Johnson",
      openings: 1,
      applicants: 8,
      createdAt: "2024-01-10"
    },
    {
      id: "demo-job-3",
      title: "Frontend Engineer",
      department: "Engineering",
      location: "Remote",
      type: "Full-time",
      status: "open",
      description: "Join our frontend team to build amazing user experiences.",
      requirements: ["3+ years experience", "React", "TypeScript"],
      salary: { min: 14e4, max: 18e4 },
      hiringManager: "Jane Smith",
      openings: 3,
      applicants: 22,
      createdAt: "2024-01-15"
    },
    {
      id: "demo-job-4",
      title: "DevOps Engineer",
      department: "Infrastructure",
      location: "San Francisco, CA",
      type: "Full-time",
      status: "open",
      description: "Help us scale our infrastructure and improve developer experience.",
      requirements: ["4+ years experience", "Kubernetes", "Terraform", "AWS"],
      salary: { min: 16e4, max: 2e5 },
      hiringManager: "Mike Chen",
      openings: 1,
      applicants: 10,
      createdAt: "2024-01-20"
    }
  ];
}
__name(generateDemoJobs, "generateDemoJobs");
function generateDemoApplications() {
  const now = /* @__PURE__ */ new Date();
  const today = now.toISOString();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1e3).toISOString();
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1e3).toISOString();
  return [
    {
      id: "demo-app-1",
      candidateId: "demo-cand-1",
      jobId: "demo-job-1",
      stage: "Interview",
      stageHistory: [
        { stage: "New", date: twoDaysAgo },
        { stage: "Screening", date: yesterday },
        { stage: "Interview", date: today }
      ],
      appliedAt: twoDaysAgo,
      updatedAt: today
    },
    {
      id: "demo-app-2",
      candidateId: "demo-cand-2",
      jobId: "demo-job-1",
      stage: "Offer",
      stageHistory: [
        { stage: "New", date: "2024-01-10" },
        { stage: "Screening", date: "2024-01-12" },
        { stage: "Interview", date: "2024-01-15" },
        { stage: "Offer", date: yesterday }
      ],
      appliedAt: "2024-01-10",
      updatedAt: yesterday
    },
    {
      id: "demo-app-3",
      candidateId: "demo-cand-3",
      jobId: "demo-job-2",
      stage: "Screening",
      stageHistory: [
        { stage: "New", date: yesterday },
        { stage: "Screening", date: today }
      ],
      appliedAt: yesterday,
      updatedAt: today
    },
    {
      id: "demo-app-4",
      candidateId: "demo-cand-4",
      jobId: "demo-job-1",
      stage: "New",
      stageHistory: [
        { stage: "New", date: today }
      ],
      appliedAt: today,
      updatedAt: today
    },
    {
      id: "demo-app-5",
      candidateId: "demo-cand-5",
      jobId: "demo-job-3",
      stage: "Interview",
      stageHistory: [
        { stage: "New", date: "2024-01-18" },
        { stage: "Screening", date: "2024-01-19" },
        { stage: "Interview", date: yesterday }
      ],
      appliedAt: "2024-01-18",
      updatedAt: yesterday
    },
    {
      id: "demo-app-6",
      candidateId: "demo-cand-6",
      jobId: "demo-job-4",
      stage: "Screening",
      stageHistory: [
        { stage: "New", date: today },
        { stage: "Screening", date: today }
      ],
      appliedAt: today,
      updatedAt: today
    },
    {
      id: "demo-app-7",
      candidateId: "demo-cand-8",
      jobId: "demo-job-3",
      stage: "Hired",
      stageHistory: [
        { stage: "New", date: "2024-01-08" },
        { stage: "Screening", date: "2024-01-10" },
        { stage: "Interview", date: "2024-01-12" },
        { stage: "Offer", date: "2024-01-16" },
        { stage: "Hired", date: yesterday }
      ],
      appliedAt: "2024-01-08",
      updatedAt: yesterday
    }
  ];
}
__name(generateDemoApplications, "generateDemoApplications");
function generateDemoUsageLogs(userId) {
  const now = /* @__PURE__ */ new Date();
  const logs = [];
  const skills2 = [
    { id: "skill-ats-candidate-search", slug: "ats-candidate-search" },
    { id: "skill-linkedin-lookup", slug: "linkedin-lookup" },
    { id: "skill-ats-candidate-crud", slug: "ats-candidate-crud" },
    { id: "skill-daily-report", slug: "daily-report" }
  ];
  for (let day2 = 0; day2 < 7; day2++) {
    const date = new Date(now.getTime() - day2 * 24 * 60 * 60 * 1e3);
    const logsPerDay = Math.floor(Math.random() * 8) + 3;
    for (let i = 0; i < logsPerDay; i++) {
      const skill = skills2[Math.floor(Math.random() * skills2.length)];
      const isSuccess = Math.random() > 0.1;
      logs.push({
        id: `demo-log-${day2}-${i}`,
        skillId: skill.id,
        skillSlug: skill.slug,
        userId,
        apiKeyId: "demo-api-key",
        status: isSuccess ? "success" : "error",
        durationMs: Math.floor(Math.random() * 2e3) + 500,
        errorMessage: isSuccess ? null : "Demo error message",
        createdAt: date.toISOString()
      });
    }
  }
  return logs;
}
__name(generateDemoUsageLogs, "generateDemoUsageLogs");
function isDemoMode(request) {
  const demoHeader = request.headers.get("X-Demo-Mode");
  if (demoHeader === "true" || demoHeader === "1") {
    return true;
  }
  const url = new URL(request.url);
  const demoParam = url.searchParams.get("demo");
  if (demoParam === "true" || demoParam === "1") {
    return true;
  }
  return false;
}
__name(isDemoMode, "isDemoMode");

// apps/api/src/routes/analytics.ts
var analyticsRoutes = new Hono2();
analyticsRoutes.use("*", jwtAuth);
analyticsRoutes.get("/usage", async (c) => {
  const user = c.get("user");
  const days = parseInt(c.req.query("days") || "30");
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1e3);
  if (isDemoMode(c.req.raw)) {
    const demoLogs = generateDemoUsageLogs(user.id);
    const filteredLogs = demoLogs.filter(
      (l) => new Date(l.createdAt) >= since
    );
    const totalExecutions2 = filteredLogs.length;
    const successCount2 = filteredLogs.filter((l) => l.status === "success").length;
    const errorCount2 = filteredLogs.filter((l) => l.status === "error").length;
    const durations2 = filteredLogs.map((l) => l.durationMs);
    const avgDurationMs2 = durations2.length > 0 ? Math.round(durations2.reduce((a, b2) => a + b2, 0) / durations2.length) : 0;
    const bySkillMap2 = /* @__PURE__ */ new Map();
    for (const log2 of filteredLogs) {
      const existing = bySkillMap2.get(log2.skillSlug);
      if (existing) {
        existing.count++;
      } else {
        bySkillMap2.set(log2.skillSlug, {
          slug: log2.skillSlug,
          name: log2.skillSlug.replace(/-/g, " ").replace(/\b\w/g, (c2) => c2.toUpperCase()),
          count: 1
        });
      }
    }
    const bySkill2 = Array.from(bySkillMap2.values()).map((s) => ({ skillSlug: s.slug, skillName: s.name, count: s.count })).sort((a, b2) => b2.count - a.count);
    const dailyMap2 = /* @__PURE__ */ new Map();
    for (const log2 of filteredLogs) {
      const date = log2.createdAt.split("T")[0];
      dailyMap2.set(date, (dailyMap2.get(date) || 0) + 1);
    }
    const daily2 = Array.from(dailyMap2.entries()).map(([date, count]) => ({ date, count })).sort((a, b2) => a.date.localeCompare(b2.date));
    const recentLogs2 = filteredLogs.slice(0, 20).map((log2) => ({
      id: log2.id,
      skillSlug: log2.skillSlug,
      skillName: log2.skillSlug.replace(/-/g, " ").replace(/\b\w/g, (c2) => c2.toUpperCase()),
      status: log2.status,
      durationMs: log2.durationMs,
      createdAt: log2.createdAt
    }));
    return c.json({
      data: {
        summary: {
          totalExecutions: totalExecutions2,
          successCount: successCount2,
          errorCount: errorCount2,
          successRate: totalExecutions2 > 0 ? (successCount2 / totalExecutions2 * 100).toFixed(1) : "0",
          avgDurationMs: avgDurationMs2
        },
        bySkill: bySkill2,
        daily: daily2,
        recentLogs: recentLogs2
      },
      demo: true
    });
  }
  const allLogs = await db.select().from(skillUsageLogs).where(
    and(
      eq(skillUsageLogs.userId, user.id),
      gte(skillUsageLogs.createdAt, since)
    )
  ).orderBy(desc(skillUsageLogs.createdAt)).limit(100);
  const allSkills = await db.select().from(skills);
  const skillMap = new Map(allSkills.map((s) => [s.id, s]));
  const totalExecutions = allLogs.length;
  const successCount = allLogs.filter((l) => l.status === "success").length;
  const errorCount = allLogs.filter((l) => l.status === "error").length;
  const durations = allLogs.filter((l) => l.durationMs).map((l) => l.durationMs);
  const avgDurationMs = durations.length > 0 ? Math.round(durations.reduce((a, b2) => a + b2, 0) / durations.length) : 0;
  const bySkillMap = /* @__PURE__ */ new Map();
  for (const log2 of allLogs) {
    const skill = skillMap.get(log2.skillId);
    if (skill) {
      const existing = bySkillMap.get(skill.slug);
      if (existing) {
        existing.count++;
      } else {
        bySkillMap.set(skill.slug, { slug: skill.slug, name: skill.name, count: 1 });
      }
    }
  }
  const bySkill = Array.from(bySkillMap.values()).map((s) => ({ skillSlug: s.slug, skillName: s.name, count: s.count })).sort((a, b2) => b2.count - a.count);
  const dailyMap = /* @__PURE__ */ new Map();
  for (const log2 of allLogs) {
    if (log2.createdAt) {
      const date = log2.createdAt.toISOString().split("T")[0];
      dailyMap.set(date, (dailyMap.get(date) || 0) + 1);
    }
  }
  const daily = Array.from(dailyMap.entries()).map(([date, count]) => ({ date, count })).sort((a, b2) => a.date.localeCompare(b2.date));
  const recentLogs = allLogs.slice(0, 20).map((log2) => {
    const skill = skillMap.get(log2.skillId);
    return {
      id: log2.id,
      skillSlug: skill?.slug || "unknown",
      skillName: skill?.name || "Unknown",
      status: log2.status,
      durationMs: log2.durationMs,
      createdAt: log2.createdAt?.toISOString()
    };
  });
  return c.json({
    data: {
      summary: {
        totalExecutions,
        successCount,
        errorCount,
        successRate: totalExecutions > 0 ? (successCount / totalExecutions * 100).toFixed(1) : "0",
        avgDurationMs
      },
      bySkill,
      daily,
      recentLogs
    }
  });
});
analyticsRoutes.get("/admin", async (c) => {
  const user = c.get("user");
  if (!user.isAdmin) {
    return c.json({ error: { message: "Forbidden" } }, 403);
  }
  const days = parseInt(c.req.query("days") || "30");
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1e3);
  const allLogs = await db.select().from(skillUsageLogs).where(gte(skillUsageLogs.createdAt, since)).orderBy(desc(skillUsageLogs.createdAt));
  const allSkills = await db.select().from(skills);
  const allUsers = await db.select().from(users);
  const skillMap = new Map(allSkills.map((s) => [s.id, s]));
  const userMap = new Map(allUsers.map((u) => [u.id, u]));
  const totalExecutions = allLogs.length;
  const successCount = allLogs.filter((l) => l.status === "success").length;
  const errorCount = allLogs.filter((l) => l.status === "error").length;
  const durations = allLogs.filter((l) => l.durationMs).map((l) => l.durationMs);
  const avgDurationMs = durations.length > 0 ? Math.round(durations.reduce((a, b2) => a + b2, 0) / durations.length) : 0;
  const uniqueUsers = new Set(allLogs.map((l) => l.userId)).size;
  const bySkillMap = /* @__PURE__ */ new Map();
  for (const log2 of allLogs) {
    const skill = skillMap.get(log2.skillId);
    if (skill) {
      const existing = bySkillMap.get(skill.slug);
      if (existing) {
        existing.count++;
        existing.users.add(log2.userId);
      } else {
        bySkillMap.set(skill.slug, {
          slug: skill.slug,
          name: skill.name,
          category: skill.category,
          count: 1,
          users: /* @__PURE__ */ new Set([log2.userId])
        });
      }
    }
  }
  const bySkill = Array.from(bySkillMap.values()).map((s) => ({ skillSlug: s.slug, skillName: s.name, category: s.category, count: s.count, uniqueUsers: s.users.size })).sort((a, b2) => b2.count - a.count);
  const userCountMap = /* @__PURE__ */ new Map();
  for (const log2 of allLogs) {
    userCountMap.set(log2.userId, (userCountMap.get(log2.userId) || 0) + 1);
  }
  const topUsers = Array.from(userCountMap.entries()).map(([userId, count]) => {
    const u = userMap.get(userId);
    return { userId, userName: u?.name || "Unknown", userEmail: u?.email || "", count };
  }).sort((a, b2) => b2.count - a.count).slice(0, 10);
  const dailyMap = /* @__PURE__ */ new Map();
  for (const log2 of allLogs) {
    if (log2.createdAt) {
      const date = log2.createdAt.toISOString().split("T")[0];
      const existing = dailyMap.get(date);
      if (existing) {
        existing.count++;
        existing.users.add(log2.userId);
      } else {
        dailyMap.set(date, { count: 1, users: /* @__PURE__ */ new Set([log2.userId]) });
      }
    }
  }
  const daily = Array.from(dailyMap.entries()).map(([date, data]) => ({ date, count: data.count, uniqueUsers: data.users.size })).sort((a, b2) => a.date.localeCompare(b2.date));
  const errorMap = /* @__PURE__ */ new Map();
  for (const log2 of allLogs.filter((l) => l.status === "error")) {
    const skill = skillMap.get(log2.skillId);
    if (skill) {
      const key = `${skill.slug}-${log2.errorMessage}`;
      const existing = errorMap.get(key);
      if (existing) {
        existing.count++;
      } else {
        errorMap.set(key, { slug: skill.slug, name: skill.name, message: log2.errorMessage, count: 1 });
      }
    }
  }
  const recentErrors = Array.from(errorMap.values()).map((e) => ({ skillSlug: e.slug, skillName: e.name, errorMessage: e.message, count: e.count })).sort((a, b2) => b2.count - a.count).slice(0, 20);
  return c.json({
    data: {
      summary: {
        totalExecutions,
        successCount,
        errorCount,
        successRate: totalExecutions > 0 ? (successCount / totalExecutions * 100).toFixed(1) : "0",
        avgDurationMs,
        uniqueUsers
      },
      bySkill,
      topUsers,
      daily,
      recentErrors
    }
  });
});

// apps/api/src/routes/proposals.ts
import { randomUUID as randomUUID4 } from "crypto";
var proposalsRoutes = new Hono2();
proposalsRoutes.use("*", jwtAuth);
proposalsRoutes.get("/", async (c) => {
  const user = c.get("user");
  const status = c.req.query("status");
  const conditions = [];
  if (!user.isAdmin) {
    conditions.push(eq(skillProposals.userId, user.id));
  }
  if (status) {
    conditions.push(eq(skillProposals.status, status));
  }
  const results = await db.select().from(skillProposals).where(conditions.length > 0 ? and(...conditions) : void 0).orderBy(desc(skillProposals.createdAt));
  const userIds = [...new Set(results.map((p2) => p2.userId))];
  const usersData = userIds.length > 0 ? await db.select().from(users) : [];
  const userMap = new Map(usersData.map((u) => [u.id, { id: u.id, name: u.name, email: u.email }]));
  return c.json({
    data: results.map((p2) => {
      const proposalUser = userMap.get(p2.userId);
      return {
        id: p2.id,
        title: p2.title,
        description: p2.description,
        useCases: p2.useCases ? JSON.parse(p2.useCases) : [],
        status: p2.status,
        reviewFeedback: p2.reviewFeedback,
        reviewedAt: p2.reviewedAt?.toISOString(),
        createdAt: p2.createdAt?.toISOString(),
        updatedAt: p2.updatedAt?.toISOString(),
        // Only include user info for admins
        ...user.isAdmin && {
          userId: p2.userId,
          userName: proposalUser?.name,
          userEmail: proposalUser?.email
        }
      };
    })
  });
});
proposalsRoutes.post("/", async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  if (!body.title || !body.description) {
    return c.json({ error: { message: "Title and description are required" } }, 400);
  }
  const id = randomUUID4();
  await db.insert(skillProposals).values({
    id,
    userId: user.id,
    title: body.title,
    description: body.description,
    useCases: body.useCases ? JSON.stringify(body.useCases) : null,
    status: "pending"
  });
  const [created] = await db.select().from(skillProposals).where(eq(skillProposals.id, id));
  return c.json({
    data: {
      id: created.id,
      title: created.title,
      description: created.description,
      useCases: created.useCases ? JSON.parse(created.useCases) : [],
      status: created.status,
      createdAt: created.createdAt?.toISOString()
    }
  }, 201);
});
proposalsRoutes.get("/:id", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  const [proposal] = await db.select().from(skillProposals).where(eq(skillProposals.id, id));
  if (!proposal) {
    return c.json({ error: { message: "Proposal not found" } }, 404);
  }
  if (!user.isAdmin && proposal.userId !== user.id) {
    return c.json({ error: { message: "Forbidden" } }, 403);
  }
  const [proposalUser] = await db.select().from(users).where(eq(users.id, proposal.userId));
  return c.json({
    data: {
      id: proposal.id,
      title: proposal.title,
      description: proposal.description,
      useCases: proposal.useCases ? JSON.parse(proposal.useCases) : [],
      status: proposal.status,
      reviewFeedback: proposal.reviewFeedback,
      reviewedAt: proposal.reviewedAt?.toISOString(),
      createdAt: proposal.createdAt?.toISOString(),
      updatedAt: proposal.updatedAt?.toISOString(),
      ...user.isAdmin && {
        userId: proposal.userId,
        userName: proposalUser?.name
      }
    }
  });
});
proposalsRoutes.put("/:id", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  const body = await c.req.json();
  const [existing] = await db.select().from(skillProposals).where(eq(skillProposals.id, id));
  if (!existing) {
    return c.json({ error: { message: "Proposal not found" } }, 404);
  }
  if (existing.userId !== user.id) {
    return c.json({ error: { message: "Forbidden" } }, 403);
  }
  if (existing.status !== "pending") {
    return c.json({ error: { message: "Cannot edit a proposal that has been reviewed" } }, 400);
  }
  await db.update(skillProposals).set({
    title: body.title || existing.title,
    description: body.description || existing.description,
    useCases: body.useCases ? JSON.stringify(body.useCases) : existing.useCases,
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq(skillProposals.id, id));
  const [updated] = await db.select().from(skillProposals).where(eq(skillProposals.id, id));
  return c.json({
    data: {
      id: updated.id,
      title: updated.title,
      description: updated.description,
      useCases: updated.useCases ? JSON.parse(updated.useCases) : [],
      status: updated.status,
      createdAt: updated.createdAt?.toISOString(),
      updatedAt: updated.updatedAt?.toISOString()
    }
  });
});
proposalsRoutes.delete("/:id", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  const [existing] = await db.select().from(skillProposals).where(eq(skillProposals.id, id));
  if (!existing) {
    return c.json({ error: { message: "Proposal not found" } }, 404);
  }
  if (existing.userId !== user.id && !user.isAdmin) {
    return c.json({ error: { message: "Forbidden" } }, 403);
  }
  if (existing.status !== "pending" && !user.isAdmin) {
    return c.json({ error: { message: "Cannot delete a proposal that has been reviewed" } }, 400);
  }
  await db.delete(skillProposals).where(eq(skillProposals.id, id));
  return c.json({ data: { success: true } });
});
proposalsRoutes.post("/:id/review", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  const body = await c.req.json();
  if (!user.isAdmin) {
    return c.json({ error: { message: "Forbidden" } }, 403);
  }
  if (!body.status || !["approved", "denied"].includes(body.status)) {
    return c.json({ error: { message: 'Status must be "approved" or "denied"' } }, 400);
  }
  const [existing] = await db.select().from(skillProposals).where(eq(skillProposals.id, id));
  if (!existing) {
    return c.json({ error: { message: "Proposal not found" } }, 404);
  }
  await db.update(skillProposals).set({
    status: body.status,
    reviewFeedback: body.feedback || null,
    reviewedBy: user.id,
    reviewedAt: /* @__PURE__ */ new Date(),
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq(skillProposals.id, id));
  const [updated] = await db.select().from(skillProposals).where(eq(skillProposals.id, id));
  return c.json({
    data: {
      id: updated.id,
      title: updated.title,
      description: updated.description,
      useCases: updated.useCases ? JSON.parse(updated.useCases) : [],
      status: updated.status,
      reviewFeedback: updated.reviewFeedback,
      reviewedAt: updated.reviewedAt?.toISOString(),
      createdAt: updated.createdAt?.toISOString(),
      updatedAt: updated.updatedAt?.toISOString()
    }
  });
});

// node_modules/.pnpm/hono@4.11.4/node_modules/hono/dist/utils/stream.js
var StreamingApi = class {
  static {
    __name(this, "StreamingApi");
  }
  writer;
  encoder;
  writable;
  abortSubscribers = [];
  responseReadable;
  /**
   * Whether the stream has been aborted.
   */
  aborted = false;
  /**
   * Whether the stream has been closed normally.
   */
  closed = false;
  constructor(writable, _readable) {
    this.writable = writable;
    this.writer = writable.getWriter();
    this.encoder = new TextEncoder();
    const reader = _readable.getReader();
    this.abortSubscribers.push(async () => {
      await reader.cancel();
    });
    this.responseReadable = new ReadableStream({
      async pull(controller) {
        const { done, value } = await reader.read();
        done ? controller.close() : controller.enqueue(value);
      },
      cancel: /* @__PURE__ */ __name(() => {
        this.abort();
      }, "cancel")
    });
  }
  async write(input) {
    try {
      if (typeof input === "string") {
        input = this.encoder.encode(input);
      }
      await this.writer.write(input);
    } catch {
    }
    return this;
  }
  async writeln(input) {
    await this.write(input + "\n");
    return this;
  }
  sleep(ms) {
    return new Promise((res) => setTimeout(res, ms));
  }
  async close() {
    try {
      await this.writer.close();
    } catch {
    }
    this.closed = true;
  }
  async pipe(body) {
    this.writer.releaseLock();
    await body.pipeTo(this.writable, { preventClose: true });
    this.writer = this.writable.getWriter();
  }
  onAbort(listener) {
    this.abortSubscribers.push(listener);
  }
  /**
   * Abort the stream.
   * You can call this method when stream is aborted by external event.
   */
  abort() {
    if (!this.aborted) {
      this.aborted = true;
      this.abortSubscribers.forEach((subscriber) => subscriber());
    }
  }
};

// node_modules/.pnpm/hono@4.11.4/node_modules/hono/dist/helper/streaming/utils.js
var isOldBunVersion = /* @__PURE__ */ __name(() => {
  const version2 = typeof Bun !== "undefined" ? Bun.version : void 0;
  if (version2 === void 0) {
    return false;
  }
  const result = version2.startsWith("1.1") || version2.startsWith("1.0") || version2.startsWith("0.");
  isOldBunVersion = /* @__PURE__ */ __name(() => result, "isOldBunVersion");
  return result;
}, "isOldBunVersion");

// node_modules/.pnpm/hono@4.11.4/node_modules/hono/dist/helper/streaming/sse.js
var SSEStreamingApi = class extends StreamingApi {
  static {
    __name(this, "SSEStreamingApi");
  }
  constructor(writable, readable) {
    super(writable, readable);
  }
  async writeSSE(message2) {
    const data = await resolveCallback(message2.data, HtmlEscapedCallbackPhase.Stringify, false, {});
    const dataLines = data.split("\n").map((line) => {
      return `data: ${line}`;
    }).join("\n");
    const sseData = [
      message2.event && `event: ${message2.event}`,
      dataLines,
      message2.id && `id: ${message2.id}`,
      message2.retry && `retry: ${message2.retry}`
    ].filter(Boolean).join("\n") + "\n\n";
    await this.write(sseData);
  }
};
var run = /* @__PURE__ */ __name(async (stream2, cb, onError) => {
  try {
    await cb(stream2);
  } catch (e) {
    if (e instanceof Error && onError) {
      await onError(e, stream2);
      await stream2.writeSSE({
        event: "error",
        data: e.message
      });
    } else {
      console.error(e);
    }
  } finally {
    stream2.close();
  }
}, "run");
var contextStash = /* @__PURE__ */ new WeakMap();
var streamSSE = /* @__PURE__ */ __name((c, cb, onError) => {
  const { readable, writable } = new TransformStream();
  const stream2 = new SSEStreamingApi(writable, readable);
  if (isOldBunVersion()) {
    c.req.raw.signal.addEventListener("abort", () => {
      if (!stream2.closed) {
        stream2.abort();
      }
    });
  }
  contextStash.set(stream2.responseReadable, c);
  c.header("Transfer-Encoding", "chunked");
  c.header("Content-Type", "text/event-stream");
  c.header("Cache-Control", "no-cache");
  c.header("Connection", "keep-alive");
  run(stream2, cb, onError);
  return c.newResponse(stream2.responseReadable);
}, "streamSSE");

// apps/api/src/routes/chat.ts
import { randomUUID as randomUUID5, createHash } from "crypto";

// apps/api/src/lib/llm.ts
var ENDPOINTS = {
  groq: "https://api.groq.com/openai/v1/chat/completions",
  openai: "https://api.openai.com/v1/chat/completions",
  anthropic: "https://api.anthropic.com/v1/messages"
};
var DEFAULT_MODELS = {
  groq: "llama-3.1-8b-instant",
  anthropic: "claude-sonnet-4-20250514",
  openai: "gpt-4o"
};
async function getProviderConfig(options = {}) {
  const settings = await db.select().from(systemSettings);
  const settingsMap = new Map(settings.map((s) => [s.key, s.value]));
  const providers = {
    groq: settingsMap.get("llm.groq_api_key"),
    anthropic: settingsMap.get("llm.anthropic_api_key"),
    openai: settingsMap.get("llm.openai_api_key")
  };
  if (options.provider) {
    const apiKey = providers[options.provider];
    if (!apiKey) {
      throw new Error(`Provider ${options.provider} is not configured. Please add an API key in Settings.`);
    }
    return {
      apiKey,
      model: options.model || DEFAULT_MODELS[options.provider],
      provider: options.provider
    };
  }
  const defaultProvider = settingsMap.get("llm.default_provider");
  const defaultModel = settingsMap.get("llm.default_model");
  if (defaultProvider && providers[defaultProvider]) {
    return {
      apiKey: providers[defaultProvider],
      model: options.model || defaultModel || DEFAULT_MODELS[defaultProvider],
      provider: defaultProvider
    };
  }
  if (process.env.GROQ_API_KEY) {
    return {
      apiKey: process.env.GROQ_API_KEY,
      model: options.model || "llama-3.1-8b-instant",
      provider: "groq"
    };
  }
  for (const [provider, apiKey] of Object.entries(providers)) {
    if (apiKey) {
      return {
        apiKey,
        model: options.model || DEFAULT_MODELS[provider],
        provider
      };
    }
  }
  throw new Error("No LLM provider configured. Please add an API key in Settings > LLM Configuration.");
}
__name(getProviderConfig, "getProviderConfig");
async function* streamChat(messages, options = {}) {
  const config = await getProviderConfig(options);
  if (config.provider === "anthropic") {
    yield* streamAnthropic(messages, config, options);
  } else {
    yield* streamOpenAICompatible(messages, config, options);
  }
}
__name(streamChat, "streamChat");
async function chat(messages, options = {}) {
  const config = await getProviderConfig(options);
  if (config.provider === "anthropic") {
    return chatAnthropic(messages, config, options);
  } else {
    return chatOpenAICompatible(messages, config, options);
  }
}
__name(chat, "chat");
async function* streamOpenAICompatible(messages, config, options) {
  const endpoint = ENDPOINTS[config.provider];
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${config.apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 2048,
      stream: true
    })
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`${config.provider} API error: ${response.status} - ${error}`);
  }
  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");
  const decoder2 = new TextDecoder();
  let buffer = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder2.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === "data: [DONE]") continue;
        if (!trimmed.startsWith("data: ")) continue;
        try {
          const json = JSON.parse(trimmed.slice(6));
          const content = json.choices?.[0]?.delta?.content;
          if (content) yield content;
        } catch {
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
__name(streamOpenAICompatible, "streamOpenAICompatible");
async function chatOpenAICompatible(messages, config, options) {
  const endpoint = ENDPOINTS[config.provider];
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${config.apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 2048,
      stream: false
    })
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`${config.provider} API error: ${response.status} - ${error}`);
  }
  const json = await response.json();
  return json.choices?.[0]?.message?.content || "";
}
__name(chatOpenAICompatible, "chatOpenAICompatible");
async function* streamAnthropic(messages, config, options) {
  const systemMessage = messages.find((m2) => m2.role === "system")?.content || "";
  const nonSystemMessages = messages.filter((m2) => m2.role !== "system");
  const response = await fetch(ENDPOINTS.anthropic, {
    method: "POST",
    headers: {
      "x-api-key": config.apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: options.maxTokens ?? 2048,
      system: systemMessage,
      messages: nonSystemMessages.map((m2) => ({
        role: m2.role,
        content: m2.content
      })),
      stream: true
    })
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic API error: ${response.status} - ${error}`);
  }
  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");
  const decoder2 = new TextDecoder();
  let buffer = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder2.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data: ")) continue;
        try {
          const json = JSON.parse(trimmed.slice(6));
          if (json.type === "content_block_delta" && json.delta?.text) {
            yield json.delta.text;
          }
        } catch {
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
__name(streamAnthropic, "streamAnthropic");
async function chatAnthropic(messages, config, options) {
  const systemMessage = messages.find((m2) => m2.role === "system")?.content || "";
  const nonSystemMessages = messages.filter((m2) => m2.role !== "system");
  const response = await fetch(ENDPOINTS.anthropic, {
    method: "POST",
    headers: {
      "x-api-key": config.apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: options.maxTokens ?? 2048,
      system: systemMessage,
      messages: nonSystemMessages.map((m2) => ({
        role: m2.role,
        content: m2.content
      }))
    })
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic API error: ${response.status} - ${error}`);
  }
  const json = await response.json();
  return json.content?.[0]?.text || "";
}
__name(chatAnthropic, "chatAnthropic");

// apps/api/src/routes/chat.ts
init_scrape_events();

// apps/api/src/lib/skills.ts
async function getSkillMetadataForUser(userId) {
  const userRoleRecords = await db.select().from(userRoles).where(eq(userRoles.userId, userId));
  let skillRecords;
  if (userRoleRecords.length === 0) {
    skillRecords = await db.select().from(skills).where(eq(skills.isEnabled, true));
  } else {
    const roleIds = userRoleRecords.map((r) => r.roleId);
    const roleSkillRecords = await db.select().from(roleSkills).where(inArray(roleSkills.roleId, roleIds));
    if (roleSkillRecords.length === 0) {
      return [];
    }
    const skillIds = [...new Set(roleSkillRecords.map((r) => r.skillId))];
    skillRecords = await db.select().from(skills).where(and(eq(skills.isEnabled, true), inArray(skills.id, skillIds)));
  }
  return skillRecords.map(toSkillMetadata);
}
__name(getSkillMetadataForUser, "getSkillMetadataForUser");
async function getAllSkillMetadata() {
  const skillRecords = await db.select().from(skills).where(eq(skills.isEnabled, true));
  return skillRecords.map(toSkillMetadata);
}
__name(getAllSkillMetadata, "getAllSkillMetadata");
async function loadSkillBySlug(slug) {
  const [skill] = await db.select().from(skills).where(and(eq(skills.slug, slug), eq(skills.isEnabled, true))).limit(1);
  if (!skill) return null;
  return {
    ...toSkillMetadata(skill),
    instructions: skill.instructions,
    version: skill.version
  };
}
__name(loadSkillBySlug, "loadSkillBySlug");
async function userCanAccessSkill(userId, skillSlug) {
  const [skill] = await db.select().from(skills).where(and(eq(skills.slug, skillSlug), eq(skills.isEnabled, true))).limit(1);
  if (!skill) return false;
  const userRoleRecords = await db.select().from(userRoles).where(eq(userRoles.userId, userId));
  if (userRoleRecords.length === 0) return true;
  const roleIds = userRoleRecords.map((r) => r.roleId);
  const [hasAccess] = await db.select().from(roleSkills).where(and(inArray(roleSkills.roleId, roleIds), eq(roleSkills.skillId, skill.id))).limit(1);
  return !!hasAccess;
}
__name(userCanAccessSkill, "userCanAccessSkill");
function toSkillMetadata(skill) {
  return {
    id: skill.id,
    slug: skill.slug,
    name: skill.name,
    description: skill.description,
    category: skill.category,
    intent: skill.intent,
    capabilities: skill.capabilities ? JSON.parse(skill.capabilities) : [],
    requiredIntegrations: skill.requiredIntegrations ? JSON.parse(skill.requiredIntegrations) : []
  };
}
__name(toSkillMetadata, "toSkillMetadata");
function buildSkillsPromptSection(skillsMetadata) {
  if (skillsMetadata.length === 0) {
    return "No skills are currently available.";
  }
  const skillsList = skillsMetadata.map((s) => {
    let entry = `- **${s.slug}**: ${s.description}`;
    if (s.intent) {
      entry += `
  - *Use when*: ${s.intent}`;
    }
    if (s.capabilities.length > 0) {
      entry += `
  - *Can*: ${s.capabilities.join(", ")}`;
    }
    return entry;
  }).join("\n");
  return `## Available Skills

The following skills are available. To use a skill, first load its full instructions with the load_skill action, then follow those instructions.

${skillsList}

### How to Use Skills

1. When a user's request matches a skill's intent, use \`load_skill\` to get full instructions:
   \`\`\`action
   {"action": "load_skill", "slug": "skill-slug-here"}
   \`\`\`

2. The system will return the skill's full instructions
3. Follow those instructions to complete the task (may involve additional actions like \`scrape_url\`)`;
}
__name(buildSkillsPromptSection, "buildSkillsPromptSection");

// apps/api/src/routes/chat.ts
var chatRoutes = new Hono2();
chatRoutes.use("*", jwtAuth);
function skillRequiresBrowser(skill) {
  const integrations2 = skill.requiredIntegrations || [];
  return integrations2.includes("linkedin") || integrations2.includes("browser");
}
__name(skillRequiresBrowser, "skillRequiresBrowser");
function buildSystemPrompt(skillsMetadata) {
  const skillsSection = buildSkillsPromptSection(skillsMetadata);
  const browserSkills = skillsMetadata.filter(skillRequiresBrowser).map((s) => `- **${s.name}**: ${s.description}`).join("\n");
  return `You are a recruiting assistant with direct access to the ATS (Applicant Tracking System) and various recruiting skills. You can execute actions to help users manage candidates, jobs, and applications.

${skillsSection}

## CRITICAL: How to Execute Actions

To execute an action, you MUST wrap the JSON in a code block with the language "action" (not "json"). Example:

\`\`\`action
{"action": "search_candidates", "query": "engineer"}
\`\`\`

The system ONLY executes code blocks marked as \`\`\`action. Any other format will NOT work.

## Available Actions

### Candidate Actions
1. **search_candidates** - Search for candidates IN THE ATS DATABASE
   \`\`\`action
   {"action": "search_candidates", "query": "python engineer", "status": "active", "stage": "Interview"}
   \`\`\`
   - query: Search term (searches name, title, company, skills)
   - status: Filter by status (active, rejected, hired)
   - stage: Filter by stage (New, Screening, Interview, Offer, Hired, Rejected)

2. **get_candidate** - Get a specific candidate by ID
   \`\`\`action
   {"action": "get_candidate", "id": "candidate-id"}
   \`\`\`

3. **create_candidate** - Create a new candidate
   \`\`\`action
   {"action": "create_candidate", "data": {"firstName": "John", "lastName": "Doe", "email": "john@example.com", "title": "Software Engineer", "company": "Acme Inc", "skills": ["Python", "React"]}}
   \`\`\`

4. **update_candidate** - Update an existing candidate
   \`\`\`action
   {"action": "update_candidate", "id": "candidate-id", "data": {"stage": "Interview", "notes": "Great technical skills"}}
   \`\`\`

### Job Actions
5. **list_jobs** - List all open jobs/requisitions
   \`\`\`action
   {"action": "list_jobs"}
   \`\`\`

6. **get_job** - Get a specific job by ID
   \`\`\`action
   {"action": "get_job", "id": "job-id"}
   \`\`\`

### Application Actions
7. **list_applications** - List applications (candidate-job associations)
   \`\`\`action
   {"action": "list_applications", "candidateId": "cand-id", "jobId": "job-id", "stage": "Interview"}
   \`\`\`

8. **update_application_stage** - Move a candidate to a new stage
   \`\`\`action
   {"action": "update_application_stage", "id": "application-id", "stage": "Offer"}
   \`\`\`

### Web Scraping Actions
9. **scrape_url** - Scrape a webpage and get its content as markdown
   \`\`\`action
   {"action": "scrape_url", "url": "https://example.com/page"}
   \`\`\`
   Note: Requires the Skillomatic browser extension to be running.

### Skill Actions
10. **load_skill** - Load a skill's full instructions (progressive disclosure)
   \`\`\`action
   {"action": "load_skill", "slug": "linkedin-lookup"}
   \`\`\`
   - Returns the skill's complete instructions
   - Use this when you need to execute a skill
   - After loading, follow the skill's instructions

## Skills Requiring Browser Extension
These skills require the Skillomatic browser extension:
${browserSkills || "None"}

## Guidelines
- IMPORTANT: Use \`\`\`action blocks, NOT \`\`\`json blocks. The system only executes \`\`\`action blocks.
- **SKILL MATCHING**: When a user's request matches a skill's intent, use load_skill FIRST to get the full instructions, then follow them.
- **CANDIDATE SOURCING**: When users ask to "find candidates", "search for engineers", "look for developers", etc. - this means sourcing NEW candidates. Use load_skill to get the appropriate skill's instructions.
- **ATS SEARCH**: Only use search_candidates when the user explicitly asks about "existing candidates", "candidates in our system", "our database", or "the ATS".
- For READ operations: Execute immediately without asking for confirmation.
- For WRITE operations: Ask for confirmation first.
- Keep your initial response brief. The action results will be shown to the user automatically.
- Be conversational and helpful.`;
}
__name(buildSystemPrompt, "buildSystemPrompt");
function parseAction(text2) {
  const match2 = text2.match(/```action\n([\s\S]*?)\n```/);
  if (!match2) return null;
  try {
    return JSON.parse(match2[1]);
  } catch {
    return null;
  }
}
__name(parseAction, "parseAction");
function normalizeUrl(urlString) {
  const url = new URL(urlString);
  url.protocol = url.protocol.toLowerCase();
  url.hostname = url.hostname.toLowerCase();
  if (url.protocol === "http:" && url.port === "80" || url.protocol === "https:" && url.port === "443") {
    url.port = "";
  }
  if (url.pathname.length > 1 && url.pathname.endsWith("/")) {
    url.pathname = url.pathname.slice(0, -1);
  }
  const trackingParams = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "fbclid", "gclid"];
  trackingParams.forEach((param) => url.searchParams.delete(param));
  url.searchParams.sort();
  url.hash = "";
  return url.toString();
}
__name(normalizeUrl, "normalizeUrl");
function hashUrl(normalizedUrl) {
  return createHash("sha256").update(normalizedUrl).digest("hex");
}
__name(hashUrl, "hashUrl");
async function waitForScrapeTask(userId, taskId, originalUrl, timeoutMs) {
  const POLL_INTERVAL_MS = 3e3;
  const startTime = Date.now();
  let eventResolver = null;
  const eventPromise = new Promise((resolve) => {
    eventResolver = resolve;
  });
  const callbackKey = `${userId}:${taskId}`;
  const { taskCallbacks: taskCallbacks2 } = await Promise.resolve().then(() => (init_scrape_events(), scrape_events_exports));
  taskCallbacks2.set(callbackKey, (event) => {
    if (eventResolver) eventResolver(event);
  });
  try {
    while (Date.now() - startTime < timeoutMs) {
      const [task] = await db.select().from(scrapeTasks).where(eq(scrapeTasks.id, taskId)).limit(1);
      if (!task) {
        return { error: "Task disappeared unexpectedly" };
      }
      if (task.status === "completed" && task.result) {
        return {
          success: true,
          url: originalUrl,
          content: task.result,
          cached: false
        };
      }
      if (task.status === "failed") {
        return {
          error: task.errorMessage || "Scrape failed",
          suggestion: "Check that the Skillomatic Scraper extension is installed and running."
        };
      }
      if (task.status === "expired") {
        return {
          error: "Scrape task expired",
          suggestion: "The Skillomatic Scraper extension may not be installed or running."
        };
      }
      const remainingTime = timeoutMs - (Date.now() - startTime);
      const waitTime = Math.min(POLL_INTERVAL_MS, remainingTime);
      if (waitTime <= 0) break;
      const result = await Promise.race([
        eventPromise,
        new Promise((resolve) => setTimeout(() => resolve(null), waitTime))
      ]);
      if (result && result.type === "task_update") {
        if (result.status === "completed" && result.result) {
          return {
            success: true,
            url: originalUrl,
            content: result.result,
            cached: false
          };
        }
        if (result.status === "failed") {
          return {
            error: result.errorMessage || "Scrape failed",
            suggestion: "Check that the Skillomatic Scraper extension is installed and running."
          };
        }
        if (result.status === "expired") {
          return {
            error: "Scrape task expired",
            suggestion: "The Skillomatic Scraper extension may not be installed or running."
          };
        }
      }
    }
    return {
      error: "Scrape timed out waiting for browser extension",
      suggestion: "Install the Skillomatic Scraper browser extension and ensure it is configured with your API key.",
      taskId
    };
  } finally {
    taskCallbacks2.delete(callbackKey);
  }
}
__name(waitForScrapeTask, "waitForScrapeTask");
async function executeAction(action, isDemo, userId) {
  switch (action.action) {
    case "search_candidates": {
      let candidates = generateDemoCandidates();
      if (action.query) {
        const q = action.query.toLowerCase();
        candidates = candidates.filter(
          (c) => c.firstName.toLowerCase().includes(q) || c.lastName.toLowerCase().includes(q) || c.title.toLowerCase().includes(q) || c.company.toLowerCase().includes(q) || c.skills.some((s) => s.toLowerCase().includes(q))
        );
      }
      if (action.status) {
        candidates = candidates.filter((c) => c.status === action.status);
      }
      if (action.stage) {
        candidates = candidates.filter((c) => c.stage === action.stage);
      }
      return { candidates, total: candidates.length, demo: isDemo };
    }
    case "get_candidate": {
      const candidates = generateDemoCandidates();
      const candidate = candidates.find((c) => c.id === action.id);
      return candidate ? { candidate, demo: isDemo } : { error: "Candidate not found" };
    }
    case "create_candidate": {
      const newCandidate = {
        id: `demo-cand-${Date.now()}`,
        ...action.data,
        status: "active",
        stage: "New",
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      return { candidate: newCandidate, created: true, demo: isDemo };
    }
    case "update_candidate": {
      const candidates = generateDemoCandidates();
      const candidate = candidates.find((c) => c.id === action.id);
      if (!candidate) return { error: "Candidate not found" };
      const updated = { ...candidate, ...action.data, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
      return { candidate: updated, updated: true, demo: isDemo };
    }
    case "list_jobs": {
      const jobs = generateDemoJobs();
      return { jobs, total: jobs.length, demo: isDemo };
    }
    case "get_job": {
      const jobs = generateDemoJobs();
      const job = jobs.find((j2) => j2.id === action.id);
      return job ? { job, demo: isDemo } : { error: "Job not found" };
    }
    case "list_applications": {
      let applications = generateDemoApplications();
      if (action.candidateId) {
        applications = applications.filter((a) => a.candidateId === action.candidateId);
      }
      if (action.jobId) {
        applications = applications.filter((a) => a.jobId === action.jobId);
      }
      if (action.stage) {
        applications = applications.filter((a) => a.stage === action.stage);
      }
      return { applications, total: applications.length, demo: isDemo };
    }
    case "update_application_stage": {
      const applications = generateDemoApplications();
      const application = applications.find((a) => a.id === action.id);
      if (!application) return { error: "Application not found" };
      const updated = {
        ...application,
        stage: action.stage,
        stageHistory: [...application.stageHistory, { stage: action.stage, date: (/* @__PURE__ */ new Date()).toISOString() }],
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      return { application: updated, updated: true, demo: isDemo };
    }
    case "load_skill": {
      const skill = await loadSkillBySlug(action.slug);
      if (!skill) {
        return { error: `Skill "${action.slug}" not found or not enabled` };
      }
      if (userId) {
        const hasAccess = await userCanAccessSkill(userId, action.slug);
        if (!hasAccess) {
          return { error: `You don't have access to the "${action.slug}" skill` };
        }
      }
      if (!skill.instructions) {
        return { error: `No instructions available for "${action.slug}"` };
      }
      return {
        skill: {
          slug: skill.slug,
          name: skill.name,
          description: skill.description,
          capabilities: skill.capabilities
        },
        instructions: skill.instructions,
        executionNote: skillRequiresBrowser(skill) ? "This skill requires the browser extension. Use scrape_url action for URLs - the extension handles scraping." : "Follow the instructions above to complete the task."
      };
    }
    case "scrape_url": {
      if (!userId) {
        return { error: "Authentication required for scraping" };
      }
      let normalizedUrl;
      let urlHash;
      try {
        normalizedUrl = normalizeUrl(action.url);
        urlHash = hashUrl(normalizedUrl);
      } catch {
        return { error: "Invalid URL format" };
      }
      const now = /* @__PURE__ */ new Date();
      const TASK_TTL_MS2 = 60 * 60 * 1e3;
      const CACHE_TTL_MS2 = 24 * 60 * 60 * 1e3;
      const MAX_WAIT_MS = 12e4;
      const cacheThreshold = new Date(now.getTime() - CACHE_TTL_MS2);
      const [cached] = await db.select().from(scrapeTasks).where(
        and(
          eq(scrapeTasks.userId, userId),
          eq(scrapeTasks.urlHash, urlHash),
          eq(scrapeTasks.status, "completed"),
          gt(scrapeTasks.completedAt, cacheThreshold)
        )
      ).orderBy(desc(scrapeTasks.completedAt)).limit(1);
      if (cached && cached.result) {
        return {
          success: true,
          url: action.url,
          content: cached.result,
          cached: true
        };
      }
      const [existing] = await db.select().from(scrapeTasks).where(
        and(
          eq(scrapeTasks.userId, userId),
          eq(scrapeTasks.urlHash, urlHash),
          gt(scrapeTasks.expiresAt, now)
        )
      ).orderBy(desc(scrapeTasks.createdAt)).limit(1);
      let taskId;
      if (existing && ["pending", "processing"].includes(existing.status)) {
        taskId = existing.id;
      } else {
        taskId = randomUUID5();
        await db.insert(scrapeTasks).values({
          id: taskId,
          userId,
          url: action.url,
          urlHash,
          status: "pending",
          createdAt: now,
          expiresAt: new Date(now.getTime() + TASK_TTL_MS2)
        });
      }
      assignTaskToExtension(userId, { id: taskId, url: action.url });
      subscribeToTask(userId, taskId);
      try {
        const result = await waitForScrapeTask(userId, taskId, action.url, MAX_WAIT_MS);
        return result;
      } finally {
        unsubscribeFromTask(userId, taskId);
      }
    }
    default:
      return { error: "Unknown action" };
  }
}
__name(executeAction, "executeAction");
chatRoutes.post("/", async (c) => {
  const body = await c.req.json();
  const { messages } = body;
  const isDemo = isDemoMode(c.req.raw);
  const user = c.get("user");
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return c.json({ error: { message: "Messages array is required" } }, 400);
  }
  const skillsMetadata = user?.id ? await getSkillMetadataForUser(user.id) : await getAllSkillMetadata();
  const systemPrompt = buildSystemPrompt(skillsMetadata);
  const chatMessages = [
    { role: "system", content: systemPrompt },
    ...messages.map((m2) => ({ role: m2.role, content: m2.content }))
  ];
  return streamSSE(c, async (stream2) => {
    try {
      let fullResponse = "";
      for await (const chunk of streamChat(chatMessages)) {
        fullResponse += chunk;
        await stream2.writeSSE({
          data: JSON.stringify({ type: "text", content: chunk })
        });
      }
      let action = parseAction(fullResponse);
      let actionCount = 0;
      const maxActions = 5;
      let currentMessages = [...chatMessages];
      let currentResponse = fullResponse;
      while (action && actionCount < maxActions) {
        actionCount++;
        const result = await executeAction(action, isDemo, user?.id);
        await stream2.writeSSE({
          data: JSON.stringify({
            type: "action_result",
            action: action.action,
            result
          })
        });
        const allowMoreActions = action.action === "load_skill";
        const followUpMessages = [
          ...currentMessages,
          { role: "assistant", content: currentResponse },
          {
            role: "user",
            content: allowMoreActions ? `[SYSTEM: Action "${action.action}" completed. Result: ${JSON.stringify(result)}]

Now execute the skill by using the appropriate action (e.g., scrape_url for LinkedIn searches). Include an action block.` : `[SYSTEM: Action "${action.action}" completed. Result: ${JSON.stringify(result)}]

Please summarize the results for the user in a helpful way. Do not include another action block.`
          }
        ];
        const followUp = await chat(followUpMessages, { maxTokens: 1e3 });
        if (followUp) {
          await stream2.writeSSE({
            data: JSON.stringify({ type: "text", content: "\n\n" + followUp })
          });
          if (allowMoreActions) {
            action = parseAction(followUp);
            currentMessages = followUpMessages;
            currentResponse = followUp;
          } else {
            action = null;
          }
        } else {
          action = null;
        }
      }
      await stream2.writeSSE({
        data: JSON.stringify({ type: "done" })
      });
    } catch (error) {
      const message2 = error instanceof Error ? error.message : "Unknown error";
      await stream2.writeSSE({
        data: JSON.stringify({ type: "error", message: message2 })
      });
    }
  });
});
chatRoutes.post("/execute-skill", async (c) => {
  const body = await c.req.json();
  const { skillSlug, params } = body;
  const isDemo = isDemoMode(c.req.raw);
  const user = c.get("user");
  const skill = await loadSkillBySlug(skillSlug);
  if (!skill) {
    return c.json({ error: { message: "Skill not found" } }, 404);
  }
  if (user?.id) {
    const hasAccess = await userCanAccessSkill(user.id, skillSlug);
    if (!hasAccess) {
      return c.json({ error: { message: "Access denied to this skill" } }, 403);
    }
  }
  if (skillRequiresBrowser(skill)) {
    return c.json({
      data: {
        type: "instructions",
        skill: {
          slug: skill.slug,
          name: skill.name,
          description: skill.description,
          capabilities: skill.capabilities
        },
        instructions: skill.instructions,
        message: "This skill requires the browser extension. Use the chat interface to execute it."
      }
    });
  }
  if (skillSlug === "ats-candidate-search") {
    const result = await executeAction(
      { action: "search_candidates", query: params?.query || "" },
      isDemo
    );
    return c.json({
      data: {
        type: "execution_result",
        skill: { slug: skill.slug, name: skill.name },
        success: true,
        result
      }
    });
  }
  if (skillSlug === "ats-candidate-crud") {
    const result = await executeAction(
      { action: "create_candidate", data: params?.candidate || {} },
      isDemo
    );
    return c.json({
      data: {
        type: "execution_result",
        skill: { slug: skill.slug, name: skill.name },
        success: true,
        result
      }
    });
  }
  return c.json({
    data: {
      type: "api_ready",
      skill: { slug: skill.slug, name: skill.name },
      message: `Skill "${skill.name}" is available but requires additional configuration.`,
      params: params || {}
    }
  });
});

// apps/api/src/routes/settings.ts
var settingsRoutes = new Hono2();
settingsRoutes.use("*", jwtAuth);
settingsRoutes.use("*", adminOnly);
var LLM_PROVIDERS = {
  groq: {
    key: "llm.groq_api_key",
    name: "Groq",
    models: ["llama-3.1-8b-instant", "llama-3.1-70b-versatile", "llama-3.3-70b-versatile", "mixtral-8x7b-32768"],
    defaultModel: "llama-3.1-8b-instant"
  },
  anthropic: {
    key: "llm.anthropic_api_key",
    name: "Anthropic",
    models: ["claude-sonnet-4-20250514", "claude-3-5-sonnet-20241022", "claude-3-haiku-20240307"],
    defaultModel: "claude-sonnet-4-20250514"
  },
  openai: {
    key: "llm.openai_api_key",
    name: "OpenAI",
    models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo"],
    defaultModel: "gpt-4o"
  }
};
settingsRoutes.get("/llm", async (c) => {
  const settings = await db.select().from(systemSettings);
  const settingsMap = new Map(settings.map((s) => [s.key, s]));
  const providers = Object.entries(LLM_PROVIDERS).map(([id, config]) => {
    const setting = settingsMap.get(config.key);
    const hasKey = !!setting?.value;
    return {
      id,
      name: config.name,
      configured: hasKey,
      models: config.models,
      defaultModel: config.defaultModel,
      // Show masked key if configured
      apiKeyPreview: hasKey ? maskApiKey(setting.value) : null
    };
  });
  const defaultProvider = settingsMap.get("llm.default_provider")?.value || "groq";
  const defaultModel = settingsMap.get("llm.default_model")?.value || "llama-3.1-8b-instant";
  return c.json({
    data: {
      providers,
      defaultProvider,
      defaultModel
    }
  });
});
settingsRoutes.put("/llm/:provider", async (c) => {
  const providerId = c.req.param("provider");
  const provider = LLM_PROVIDERS[providerId];
  if (!provider) {
    return c.json({ error: { message: "Unknown provider" } }, 400);
  }
  const body = await c.req.json();
  const { apiKey } = body;
  if (!apiKey || typeof apiKey !== "string") {
    return c.json({ error: { message: "API key is required" } }, 400);
  }
  if (!validateApiKeyFormat(providerId, apiKey)) {
    return c.json({ error: { message: "Invalid API key format" } }, 400);
  }
  const user = c.get("user");
  await db.insert(systemSettings).values({
    key: provider.key,
    value: apiKey,
    isSecret: true,
    updatedAt: /* @__PURE__ */ new Date(),
    updatedBy: user.sub
  }).onConflictDoUpdate({
    target: systemSettings.key,
    set: {
      value: apiKey,
      updatedAt: /* @__PURE__ */ new Date(),
      updatedBy: user.sub
    }
  });
  return c.json({
    data: {
      provider: providerId,
      configured: true,
      apiKeyPreview: maskApiKey(apiKey)
    }
  });
});
settingsRoutes.delete("/llm/:provider", async (c) => {
  const providerId = c.req.param("provider");
  const provider = LLM_PROVIDERS[providerId];
  if (!provider) {
    return c.json({ error: { message: "Unknown provider" } }, 400);
  }
  await db.delete(systemSettings).where(eq(systemSettings.key, provider.key));
  return c.json({ data: { success: true } });
});
settingsRoutes.put("/llm/default", async (c) => {
  const body = await c.req.json();
  const { provider, model } = body;
  if (!provider || !LLM_PROVIDERS[provider]) {
    return c.json({ error: { message: "Invalid provider" } }, 400);
  }
  const providerConfig = LLM_PROVIDERS[provider];
  if (!providerConfig.models.includes(model)) {
    return c.json({ error: { message: "Invalid model for provider" } }, 400);
  }
  const user = c.get("user");
  await db.insert(systemSettings).values({
    key: "llm.default_provider",
    value: provider,
    isSecret: false,
    updatedAt: /* @__PURE__ */ new Date(),
    updatedBy: user.sub
  }).onConflictDoUpdate({
    target: systemSettings.key,
    set: {
      value: provider,
      updatedAt: /* @__PURE__ */ new Date(),
      updatedBy: user.sub
    }
  });
  await db.insert(systemSettings).values({
    key: "llm.default_model",
    value: model,
    isSecret: false,
    updatedAt: /* @__PURE__ */ new Date(),
    updatedBy: user.sub
  }).onConflictDoUpdate({
    target: systemSettings.key,
    set: {
      value: model,
      updatedAt: /* @__PURE__ */ new Date(),
      updatedBy: user.sub
    }
  });
  return c.json({
    data: {
      defaultProvider: provider,
      defaultModel: model
    }
  });
});
function maskApiKey(key) {
  if (key.length <= 8) return "****";
  return key.slice(0, 4) + "..." + key.slice(-4);
}
__name(maskApiKey, "maskApiKey");
function validateApiKeyFormat(provider, key) {
  switch (provider) {
    case "groq":
      return key.startsWith("gsk_") && key.length > 20;
    case "anthropic":
      return key.startsWith("sk-ant-") && key.length > 20;
    case "openai":
      return key.startsWith("sk-") && key.length > 20;
    default:
      return key.length > 10;
  }
}
__name(validateApiKeyFormat, "validateApiKeyFormat");

// apps/api/src/openapi.ts
var openApiSpec = {
  openapi: "3.1.0",
  info: {
    title: "Skillomatic API",
    version: "1.0.0",
    description: `
Skillomatic is a platform for managing AI skills for recruiting workflows.

## Authentication

All protected endpoints require JWT authentication via Bearer token:
\`\`\`
Authorization: Bearer <jwt-token>
\`\`\`

Admin-only endpoints additionally require the user to have \`isAdmin: true\`.

## Response Format

All responses follow a consistent format:
\`\`\`json
{
  "data": { ... }  // Success response
}
\`\`\`

or on error:
\`\`\`json
{
  "error": { "message": "Error description" }
}
\`\`\`
    `.trim(),
    contact: {
      name: "Skillomatic Support"
    }
  },
  servers: [
    {
      url: "/api",
      description: "API base path"
    }
  ],
  tags: [
    { name: "Auth", description: "Authentication endpoints" },
    { name: "Users", description: "User management (admin only)" },
    { name: "Skills", description: "Skill catalog and downloads" },
    { name: "Analytics", description: "Usage analytics" },
    { name: "Settings", description: "System settings (admin only)" },
    { name: "Proposals", description: "Skill proposals" },
    { name: "API Keys", description: "API key management" }
  ],
  paths: {
    // Auth
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login with email and password",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string" }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Login successful",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "object",
                      properties: {
                        token: { type: "string", description: "JWT token" },
                        user: { $ref: "#/components/schemas/UserPublic" }
                      }
                    }
                  }
                }
              }
            }
          },
          "401": { $ref: "#/components/responses/Unauthorized" }
        }
      }
    },
    "/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Get current user info",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Current user",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/UserPublic" }
                  }
                }
              }
            }
          },
          "401": { $ref: "#/components/responses/Unauthorized" }
        }
      }
    },
    // Users (Admin)
    "/users": {
      get: {
        tags: ["Users"],
        summary: "List all users (admin only)",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "List of users",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/UserPublic" }
                    }
                  }
                }
              }
            }
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" }
        }
      },
      post: {
        tags: ["Users"],
        summary: "Create a new user (admin only)",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password", "name"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string", minLength: 6 },
                  name: { type: "string" },
                  isAdmin: { type: "boolean", default: false }
                }
              }
            }
          }
        },
        responses: {
          "201": {
            description: "User created",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/UserPublic" }
                  }
                }
              }
            }
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" }
        }
      }
    },
    "/users/{id}": {
      get: {
        tags: ["Users"],
        summary: "Get user by ID (admin only)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }
        ],
        responses: {
          "200": {
            description: "User details",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/UserPublic" }
                  }
                }
              }
            }
          },
          "404": { $ref: "#/components/responses/NotFound" }
        }
      },
      delete: {
        tags: ["Users"],
        summary: "Delete user (admin only)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }
        ],
        responses: {
          "200": {
            description: "User deleted",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "object",
                      properties: { message: { type: "string" } }
                    }
                  }
                }
              }
            }
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "404": { $ref: "#/components/responses/NotFound" }
        }
      }
    },
    // Skills
    "/skills": {
      get: {
        tags: ["Skills"],
        summary: "List all skills",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "List of skills",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Skill" }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/skills/{slug}": {
      get: {
        tags: ["Skills"],
        summary: "Get skill by slug",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "slug", in: "path", required: true, schema: { type: "string" } }
        ],
        responses: {
          "200": {
            description: "Skill details",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/Skill" }
                  }
                }
              }
            }
          },
          "404": { $ref: "#/components/responses/NotFound" }
        }
      }
    },
    "/skills/{slug}/download": {
      get: {
        tags: ["Skills"],
        summary: "Download skill markdown file (public)",
        parameters: [
          { name: "slug", in: "path", required: true, schema: { type: "string" } }
        ],
        responses: {
          "200": {
            description: "Skill markdown content",
            content: {
              "text/markdown": {
                schema: { type: "string" }
              }
            }
          },
          "404": { $ref: "#/components/responses/NotFound" }
        }
      }
    },
    "/skills/install.sh": {
      get: {
        tags: ["Skills"],
        summary: "Download install script for all skills (public)",
        responses: {
          "200": {
            description: "Bash install script",
            content: {
              "text/plain": {
                schema: { type: "string" }
              }
            }
          }
        }
      }
    },
    // Analytics
    "/analytics/usage": {
      get: {
        tags: ["Analytics"],
        summary: "Get current user usage stats",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "days", in: "query", schema: { type: "integer", default: 30 }, description: "Number of days to look back" }
        ],
        responses: {
          "200": {
            description: "User usage analytics",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/UsageAnalytics" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/analytics/admin": {
      get: {
        tags: ["Analytics"],
        summary: "Get platform-wide analytics (admin only)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "days", in: "query", schema: { type: "integer", default: 30 }, description: "Number of days to look back" }
        ],
        responses: {
          "200": {
            description: "Platform-wide analytics",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/AdminAnalytics" }
                  }
                }
              }
            }
          },
          "403": { $ref: "#/components/responses/Forbidden" }
        }
      }
    },
    // Settings (Admin)
    "/settings/llm": {
      get: {
        tags: ["Settings"],
        summary: "Get LLM configuration (admin only)",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "LLM settings",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/LLMSettings" }
                  }
                }
              }
            }
          },
          "403": { $ref: "#/components/responses/Forbidden" }
        }
      }
    },
    "/settings/llm/{provider}": {
      put: {
        tags: ["Settings"],
        summary: "Set API key for LLM provider (admin only)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "provider", in: "path", required: true, schema: { type: "string", enum: ["groq", "anthropic", "openai"] } }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["apiKey"],
                properties: {
                  apiKey: { type: "string" }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "API key set",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "object",
                      properties: {
                        provider: { type: "string" },
                        configured: { type: "boolean" },
                        apiKeyPreview: { type: "string" }
                      }
                    }
                  }
                }
              }
            }
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "403": { $ref: "#/components/responses/Forbidden" }
        }
      },
      delete: {
        tags: ["Settings"],
        summary: "Remove API key for LLM provider (admin only)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "provider", in: "path", required: true, schema: { type: "string", enum: ["groq", "anthropic", "openai"] } }
        ],
        responses: {
          "200": {
            description: "API key removed",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { type: "object", properties: { success: { type: "boolean" } } }
                  }
                }
              }
            }
          },
          "403": { $ref: "#/components/responses/Forbidden" }
        }
      }
    },
    "/settings/llm/default": {
      put: {
        tags: ["Settings"],
        summary: "Set default LLM provider and model (admin only)",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["provider", "model"],
                properties: {
                  provider: { type: "string", enum: ["groq", "anthropic", "openai"] },
                  model: { type: "string" }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Default set",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "object",
                      properties: {
                        defaultProvider: { type: "string" },
                        defaultModel: { type: "string" }
                      }
                    }
                  }
                }
              }
            }
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "403": { $ref: "#/components/responses/Forbidden" }
        }
      }
    },
    // Proposals
    "/proposals": {
      get: {
        tags: ["Proposals"],
        summary: "List skill proposals (user sees own, admin sees all)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "status", in: "query", schema: { type: "string", enum: ["pending", "approved", "denied"] } }
        ],
        responses: {
          "200": {
            description: "List of proposals",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Proposal" }
                    }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        tags: ["Proposals"],
        summary: "Create a new skill proposal",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["title", "description"],
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  useCases: { type: "array", items: { type: "string" } }
                }
              }
            }
          }
        },
        responses: {
          "201": {
            description: "Proposal created",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/Proposal" }
                  }
                }
              }
            }
          },
          "400": { $ref: "#/components/responses/BadRequest" }
        }
      }
    },
    "/proposals/{id}": {
      get: {
        tags: ["Proposals"],
        summary: "Get proposal by ID",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }
        ],
        responses: {
          "200": {
            description: "Proposal details",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/Proposal" }
                  }
                }
              }
            }
          },
          "404": { $ref: "#/components/responses/NotFound" }
        }
      },
      put: {
        tags: ["Proposals"],
        summary: "Update proposal (owner only, pending status only)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  useCases: { type: "array", items: { type: "string" } }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Proposal updated",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/Proposal" }
                  }
                }
              }
            }
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "403": { $ref: "#/components/responses/Forbidden" }
        }
      },
      delete: {
        tags: ["Proposals"],
        summary: "Delete proposal",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }
        ],
        responses: {
          "200": {
            description: "Proposal deleted",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { type: "object", properties: { success: { type: "boolean" } } }
                  }
                }
              }
            }
          },
          "403": { $ref: "#/components/responses/Forbidden" }
        }
      }
    },
    "/proposals/{id}/review": {
      post: {
        tags: ["Proposals"],
        summary: "Review proposal (admin only)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["status"],
                properties: {
                  status: { type: "string", enum: ["approved", "denied"] },
                  feedback: { type: "string" }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Proposal reviewed",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/Proposal" }
                  }
                }
              }
            }
          },
          "403": { $ref: "#/components/responses/Forbidden" }
        }
      }
    }
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT"
      }
    },
    schemas: {
      UserPublic: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          email: { type: "string", format: "email" },
          name: { type: "string" },
          avatarUrl: { type: "string", nullable: true },
          isAdmin: { type: "boolean" }
        }
      },
      Skill: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          slug: { type: "string" },
          name: { type: "string" },
          description: { type: "string" },
          category: { type: "string", enum: ["sourcing", "outreach", "ats", "analytics", "other"] },
          version: { type: "string" },
          requiredIntegrations: { type: "array", items: { type: "string" } },
          requiredScopes: { type: "array", items: { type: "string" } },
          intent: { type: "string" },
          capabilities: { type: "array", items: { type: "string" } },
          isEnabled: { type: "boolean" }
        }
      },
      Proposal: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          title: { type: "string" },
          description: { type: "string" },
          useCases: { type: "array", items: { type: "string" } },
          status: { type: "string", enum: ["pending", "approved", "denied"] },
          reviewFeedback: { type: "string", nullable: true },
          reviewedAt: { type: "string", format: "date-time", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
          userId: { type: "string", format: "uuid", description: "Only included for admins" },
          userName: { type: "string", description: "Only included for admins" },
          userEmail: { type: "string", description: "Only included for admins" }
        }
      },
      UsageAnalytics: {
        type: "object",
        properties: {
          summary: {
            type: "object",
            properties: {
              totalExecutions: { type: "integer" },
              successCount: { type: "integer" },
              errorCount: { type: "integer" },
              successRate: { type: "string" },
              avgDurationMs: { type: "integer" }
            }
          },
          bySkill: {
            type: "array",
            items: {
              type: "object",
              properties: {
                skillSlug: { type: "string" },
                skillName: { type: "string" },
                count: { type: "integer" }
              }
            }
          },
          daily: {
            type: "array",
            items: {
              type: "object",
              properties: {
                date: { type: "string", format: "date" },
                count: { type: "integer" }
              }
            }
          },
          recentLogs: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                skillSlug: { type: "string" },
                skillName: { type: "string" },
                status: { type: "string" },
                durationMs: { type: "integer" },
                createdAt: { type: "string", format: "date-time" }
              }
            }
          }
        }
      },
      AdminAnalytics: {
        type: "object",
        properties: {
          summary: {
            type: "object",
            properties: {
              totalExecutions: { type: "integer" },
              successCount: { type: "integer" },
              errorCount: { type: "integer" },
              successRate: { type: "string" },
              avgDurationMs: { type: "integer" },
              uniqueUsers: { type: "integer" }
            }
          },
          bySkill: {
            type: "array",
            items: {
              type: "object",
              properties: {
                skillSlug: { type: "string" },
                skillName: { type: "string" },
                category: { type: "string" },
                count: { type: "integer" },
                uniqueUsers: { type: "integer" }
              }
            }
          },
          topUsers: {
            type: "array",
            items: {
              type: "object",
              properties: {
                userId: { type: "string" },
                userName: { type: "string" },
                userEmail: { type: "string" },
                count: { type: "integer" }
              }
            }
          },
          daily: {
            type: "array",
            items: {
              type: "object",
              properties: {
                date: { type: "string", format: "date" },
                count: { type: "integer" },
                uniqueUsers: { type: "integer" }
              }
            }
          },
          recentErrors: {
            type: "array",
            items: {
              type: "object",
              properties: {
                skillSlug: { type: "string" },
                skillName: { type: "string" },
                errorMessage: { type: "string", nullable: true },
                count: { type: "integer" }
              }
            }
          }
        }
      },
      LLMSettings: {
        type: "object",
        properties: {
          providers: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string", enum: ["groq", "anthropic", "openai"] },
                name: { type: "string" },
                configured: { type: "boolean" },
                models: { type: "array", items: { type: "string" } },
                defaultModel: { type: "string" },
                apiKeyPreview: { type: "string", nullable: true }
              }
            }
          },
          defaultProvider: { type: "string" },
          defaultModel: { type: "string" }
        }
      }
    },
    responses: {
      BadRequest: {
        description: "Bad request",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                error: {
                  type: "object",
                  properties: { message: { type: "string" } }
                }
              }
            }
          }
        }
      },
      Unauthorized: {
        description: "Unauthorized - invalid or missing JWT token",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                error: {
                  type: "object",
                  properties: { message: { type: "string" } }
                }
              }
            }
          }
        }
      },
      Forbidden: {
        description: "Forbidden - admin access required",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                error: {
                  type: "object",
                  properties: { message: { type: "string" } }
                }
              }
            }
          }
        }
      },
      NotFound: {
        description: "Resource not found",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                error: {
                  type: "object",
                  properties: { message: { type: "string" } }
                }
              }
            }
          }
        }
      }
    }
  }
};

// apps/api/src/routes/docs.ts
var docsRoutes = new Hono2();
docsRoutes.get("/openapi.json", (c) => {
  return c.json(openApiSpec);
});
docsRoutes.get("/", (c) => {
  const markdown = `# Skillomatic API Reference

Base URL: \`/api\`

## Authentication
All protected endpoints require: \`Authorization: Bearer <jwt-token>\`
Admin endpoints additionally require \`isAdmin: true\` on the user.

## Endpoints

### Auth
- \`POST /auth/login\` - Login with email/password, returns JWT token
- \`GET /auth/me\` - Get current user info (requires auth)

### Users (Admin Only)
- \`GET /users\` - List all users
- \`POST /users\` - Create user (body: email, password, name, isAdmin?)
- \`GET /users/:id\` - Get user by ID
- \`DELETE /users/:id\` - Delete user

### Skills
- \`GET /skills\` - List all skills (requires auth)
- \`GET /skills/:slug\` - Get skill details (requires auth)
- \`GET /skills/:slug/download\` - Download skill markdown (public)
- \`GET /skills/install.sh\` - Download install script (public)

### Analytics
- \`GET /analytics/usage?days=30\` - User's own usage stats
- \`GET /analytics/admin?days=30\` - Platform-wide stats (admin only)

### Settings (Admin Only)
- \`GET /settings/llm\` - Get LLM provider configuration
- \`PUT /settings/llm/:provider\` - Set API key (body: apiKey)
- \`DELETE /settings/llm/:provider\` - Remove API key
- \`PUT /settings/llm/default\` - Set default provider/model (body: provider, model)

Providers: groq, anthropic, openai

### Proposals
- \`GET /proposals?status=pending\` - List proposals (user sees own, admin sees all)
- \`POST /proposals\` - Create proposal (body: title, description, useCases[])
- \`GET /proposals/:id\` - Get proposal details
- \`PUT /proposals/:id\` - Update proposal (owner only, pending status)
- \`DELETE /proposals/:id\` - Delete proposal
- \`POST /proposals/:id/review\` - Review proposal (admin only, body: status, feedback?)

## Response Format
Success: \`{ "data": { ... } }\`
Error: \`{ "error": { "message": "..." } }\`

## Full OpenAPI Spec
Available at: \`/api/docs/openapi.json\`

## Getting Started
- New user onboarding: \`/api/onboarding\`
- Browser extension guide: \`/api/extension\`
`;
  return c.text(markdown, 200, {
    "Content-Type": "text/markdown"
  });
});

// apps/api/src/routes/extension.ts
var extensionRoutes = new Hono2();
extensionRoutes.get("/", (c) => {
  const apiUrl = process.env.API_URL || c.req.header("host") || "http://localhost:3000";
  const markdown = `# Skillomatic Scraper Browser Extension

The Skillomatic Scraper extension enables LinkedIn profile lookups by opening pages in your authenticated browser session.

## Why This Extension?

When you use \`/linkedin-lookup\` in Claude, the skill needs to access LinkedIn profile data. Instead of managing OAuth tokens or storing credentials, the extension opens LinkedIn pages **in your actual browser** where you're already logged in.

## How It Works

\`\`\`
Claude Code                    Skillomatic API                   Your Browser
    \u2502                              \u2502                              \u2502
    \u2502 1. /linkedin-lookup          \u2502                              \u2502
    \u2502 \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u25BA  \u2502                              \u2502
    \u2502                              \u2502                              \u2502
    \u2502 2. Create scrape task        \u2502                              \u2502
    \u2502    POST /api/v1/scrape/tasks \u2502                              \u2502
    \u2502                              \u2502                              \u2502
    \u2502                              \u2502 3. Extension polls for tasks \u2502
    \u2502                              \u2502 \u25C4\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500  \u2502
    \u2502                              \u2502                              \u2502
    \u2502                              \u2502 4. Return pending task       \u2502
    \u2502                              \u2502 \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u25BA  \u2502
    \u2502                              \u2502                              \u2502
    \u2502                              \u2502 5. Extension opens LinkedIn  \u2502
    \u2502                              \u2502    in a new tab (logged in!) \u2502
    \u2502                              \u2502                              \u2502
    \u2502                              \u2502 6. Extract page content      \u2502
    \u2502                              \u2502 \u25C4\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500  \u2502
    \u2502                              \u2502                              \u2502
    \u2502 7. Return profile data       \u2502                              \u2502
    \u2502 \u25C4\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500  \u2502                              \u2502
\`\`\`

## Installation

### Step 1: Get the Extension

The extension source is in \`apps/skillomatic-scraper/\` in the Skillomatic repository.

**Option A: Load Unpacked (Development)**

1. Download or clone the Skillomatic repository
2. Open Chrome and go to \`chrome://extensions/\`
3. Enable **Developer mode** (toggle in top-right corner)
4. Click **Load unpacked**
5. Select the \`apps/skillomatic-scraper\` folder
6. The extension icon should appear in your toolbar

**Option B: Enterprise Installation**

If your IT department has deployed the extension, it may already be installed. Check your Chrome extensions or contact IT.

### Step 2: Configure the Extension

1. Click the **Skillomatic Scraper** extension icon in your Chrome toolbar
2. Enter your configuration:

   **API URL:**
   \`\`\`
   ${apiUrl}
   \`\`\`

   **API Key:**
   Your personal API key from the Skillomatic dashboard (starts with \`sk_live_\`)

3. Click **Save & Connect**

### Step 3: Verify Connection

The extension popup should show:
- **Status:** Green dot with "Polling"
- **API Key:** "Configured" or a masked version

If you see a red dot or errors, check:
- API URL is correct (no trailing slash)
- API key is valid and not revoked
- You're connected to the internet

## Usage

Once configured, the extension works automatically:

1. Keep Chrome open in the background
2. Make sure you're logged into LinkedIn
3. Use \`/linkedin-lookup\` in Claude Code
4. The extension will open LinkedIn pages and extract profile data

You'll see brief tab flashes as the extension opens and closes tabs.

## Troubleshooting

### Extension shows "Not connected"

- Verify the API URL is correct
- Check your API key is valid
- Try clicking "Save & Connect" again

### Scrape tasks stay "pending"

- Is Chrome running? The extension needs the browser open
- Is the extension enabled? Check \`chrome://extensions/\`
- Click the extension icon and verify "Polling" status

### LinkedIn pages don't load

- Are you logged into LinkedIn? Open linkedin.com and verify
- Is there a popup blocker? Allow popups from the extension
- LinkedIn may be rate-limiting - wait a few minutes

### Tasks timeout after 2 minutes

The extension may not be responding. Check:
- Extension is installed and enabled
- Chrome is in the foreground (some systems throttle background tabs)
- No browser extensions blocking the scraper

## Security Notes

- The extension only accesses URLs for scrape tasks from the Skillomatic API
- Your LinkedIn session cookies stay in your browser - never sent to the API
- Only page content (as markdown) is sent back to Skillomatic
- API key is stored in Chrome's sync storage (encrypted)

## Extension Permissions

| Permission | Purpose |
|------------|---------|
| \`storage\` | Store API URL and key |
| \`tabs\` | Open new tabs for scraping |
| \`scripting\` | Extract page content |
| \`<all_urls>\` | Access LinkedIn pages |

## Getting Help

- **Extension issues:** Check this page or contact IT
- **API issues:** Check the Skillomatic dashboard
- **LinkedIn access:** Verify your LinkedIn account status

---

*Extension version: 1.0.0*
*API: ${apiUrl}*
`;
  return c.text(markdown, 200, {
    "Content-Type": "text/markdown"
  });
});
extensionRoutes.get("/status", (c) => {
  return c.json({
    status: "ok",
    version: "1.0.0",
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});

// packages/shared/src/types.ts
var ONBOARDING_STEPS2 = {
  /** User just created account, hasn't started onboarding */
  NOT_STARTED: 0,
  /** User has connected their ATS integration */
  ATS_CONNECTED: 1,
  /** User has generated their API key for desktop chat */
  API_KEY_GENERATED: 2,
  /** User has installed the browser extension */
  EXTENSION_INSTALLED: 2.5,
  /** User has configured deployment mode (web UI or desktop) */
  DEPLOYMENT_CONFIGURED: 3,
  /** Onboarding complete */
  COMPLETE: 4
};
var MAX_ONBOARDING_STEP2 = Math.max(...Object.values(ONBOARDING_STEPS2));
function getNextOnboardingStep(currentStep) {
  const steps = Object.values(ONBOARDING_STEPS2).sort((a, b2) => a - b2);
  for (const step of steps) {
    if (step > currentStep) return step;
  }
  return null;
}
__name(getNextOnboardingStep, "getNextOnboardingStep");
function getOnboardingStepName(step) {
  if (step >= ONBOARDING_STEPS2.COMPLETE) return "Complete";
  if (step >= ONBOARDING_STEPS2.DEPLOYMENT_CONFIGURED) return "Configure Deployment";
  if (step >= ONBOARDING_STEPS2.EXTENSION_INSTALLED) return "Install Extension";
  if (step >= ONBOARDING_STEPS2.API_KEY_GENERATED) return "Generate API Key";
  if (step >= ONBOARDING_STEPS2.ATS_CONNECTED) return "Connect ATS";
  return "Get Started";
}
__name(getOnboardingStepName, "getOnboardingStepName");
function getErrorCategory(code) {
  if (code.startsWith("LLM_")) return "llm";
  if (code.startsWith("ATS_")) return "ats";
  if (code.startsWith("SKILL_")) return "skill";
  if (code.startsWith("SCRAPE_")) return "scrape";
  if (code.startsWith("INTEGRATION_")) return "integration";
  return "system";
}
__name(getErrorCategory, "getErrorCategory");

// apps/api/src/routes/onboarding.ts
var onboardingRoutes = new Hono2();
onboardingRoutes.get("/status", jwtAuth, async (c) => {
  const user = c.get("user");
  const [dbUser] = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
  if (!dbUser) {
    return c.json({ error: { message: "User not found" } }, 404);
  }
  const currentStep = dbUser.onboardingStep ?? 0;
  const isComplete = currentStep >= MAX_ONBOARDING_STEP;
  const nextStep = getNextOnboardingStep(currentStep);
  const status = {
    currentStep,
    isComplete,
    nextStep,
    nextStepName: nextStep !== null ? getOnboardingStepName(nextStep) : null
  };
  return c.json({ data: status });
});
onboardingRoutes.post("/advance", jwtAuth, async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  if (typeof body.step !== "number") {
    return c.json({ error: { message: "Step must be a number" } }, 400);
  }
  const [dbUser] = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
  if (!dbUser) {
    return c.json({ error: { message: "User not found" } }, 404);
  }
  const currentStep = dbUser.onboardingStep ?? 0;
  if (body.step < currentStep) {
    return c.json(
      { error: { message: "Cannot go back in onboarding. Current step: " + currentStep } },
      400
    );
  }
  await db.update(users).set({
    onboardingStep: body.step,
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq(users.id, user.id));
  const isComplete = body.step >= MAX_ONBOARDING_STEP;
  const nextStep = getNextOnboardingStep(body.step);
  const status = {
    currentStep: body.step,
    isComplete,
    nextStep,
    nextStepName: nextStep !== null ? getOnboardingStepName(nextStep) : null
  };
  return c.json({ data: status });
});
onboardingRoutes.post("/complete-step", jwtAuth, async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  if (!body.stepName || !(body.stepName in ONBOARDING_STEPS)) {
    return c.json(
      {
        error: {
          message: "Invalid step name. Valid steps: " + Object.keys(ONBOARDING_STEPS).join(", ")
        }
      },
      400
    );
  }
  const stepValue = ONBOARDING_STEPS[body.stepName];
  const [dbUser] = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
  if (!dbUser) {
    return c.json({ error: { message: "User not found" } }, 404);
  }
  const currentStep = dbUser.onboardingStep ?? 0;
  if (stepValue <= currentStep) {
    const isComplete2 = currentStep >= MAX_ONBOARDING_STEP;
    const nextStep2 = getNextOnboardingStep(currentStep);
    return c.json({
      data: {
        currentStep,
        isComplete: isComplete2,
        nextStep: nextStep2,
        nextStepName: nextStep2 !== null ? getOnboardingStepName(nextStep2) : null,
        message: "Already completed this step"
      }
    });
  }
  await db.update(users).set({
    onboardingStep: stepValue,
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq(users.id, user.id));
  const isComplete = stepValue >= MAX_ONBOARDING_STEP;
  const nextStep = getNextOnboardingStep(stepValue);
  const status = {
    currentStep: stepValue,
    isComplete,
    nextStep,
    nextStepName: nextStep !== null ? getOnboardingStepName(nextStep) : null
  };
  return c.json({ data: status });
});
onboardingRoutes.post("/reset", jwtAuth, async (c) => {
  const user = c.get("user");
  if (!user.isSuperAdmin) {
    return c.json({ error: { message: "Only super admins can reset onboarding" } }, 403);
  }
  await db.update(users).set({
    onboardingStep: ONBOARDING_STEPS.NOT_STARTED,
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq(users.id, user.id));
  const nextStep = getNextOnboardingStep(ONBOARDING_STEPS.NOT_STARTED);
  const status = {
    currentStep: ONBOARDING_STEPS.NOT_STARTED,
    isComplete: false,
    nextStep,
    nextStepName: nextStep !== null ? getOnboardingStepName(nextStep) : null
  };
  return c.json({ data: status });
});
onboardingRoutes.get("/", (c) => {
  const host = c.req.header("host") || "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  const baseUrl = `${protocol}://${host}`;
  const markdown = `# Welcome to Skillomatic

Skillomatic lets you search candidates, manage your ATS, and source from LinkedIn - all through natural conversation in Claude.

**Goal:** Get you out of dashboards and into Claude in 5 minutes.

---

## One-Time Setup

### 1. Get Your API Key

1. Go to ${baseUrl} and sign in
2. Click **API Keys** > **Generate Key**
3. Copy the key (starts with \`sk_live_\`)

### 2. Save It (Terminal)

\`\`\`bash
security add-generic-password -a $USER -s SKILLOMATIC_API_KEY -w 'PASTE_KEY_HERE'
echo 'export SKILLOMATIC_API_KEY=$(security find-generic-password -a "$USER" -s "SKILLOMATIC_API_KEY" -w 2>/dev/null)' >> ~/.zshrc
source ~/.zshrc
\`\`\`

### 3. Install Skills

\`\`\`bash
mkdir -p ~/.claude/commands
\`\`\`

Download skills from ${baseUrl}/skills and move to \`~/.claude/commands/\`

---

## Start Using Claude

Open **Claude Code** or **Claude Desktop** and try:

\`\`\`
/ats-candidate-search

Senior backend engineer, 5+ years Python, Bay Area
\`\`\`

That's it. You're sourcing candidates through conversation now.

---

## What You Can Do

| Instead of... | Just ask Claude |
|---------------|-----------------|
| Clicking through ATS filters | \`/ats-candidate-search\` + paste job description |
| Manually searching LinkedIn | \`/linkedin-lookup\` + describe ideal candidate |
| Copy-pasting into spreadsheets | \`/daily-report\` for activity summaries |
| Typing candidate info into ATS | \`/ats-candidate-crud\` + "add Jane Doe..." |

Chain them together: *"Find Python engineers on LinkedIn, add the top 3 to our ATS, and draft outreach emails"*

---

## LinkedIn Setup (Optional)

For \`/linkedin-lookup\`, install the browser extension:

1. Get extension from IT (or load \`apps/skillomatic-scraper/\` in Chrome)
2. Click extension icon > enter API URL \`${baseUrl}\` + your API key
3. Stay logged into LinkedIn in Chrome

Guide: ${baseUrl}/api/extension

---

## Help

Stuck? Ask Claude: *"Run /skillomatic-health-check"*

API key issues? Regenerate at ${baseUrl}
`;
  return c.text(markdown, 200, {
    "Content-Type": "text/markdown"
  });
});

// apps/api/src/routes/organizations.ts
import { randomUUID as randomUUID6 } from "crypto";
var organizationsRoutes = new Hono2();
function generateSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50);
}
__name(generateSlug, "generateSlug");
async function getMemberCount(orgId) {
  const result = await db.select().from(users).where(eq(users.organizationId, orgId));
  return result.length;
}
__name(getMemberCount, "getMemberCount");
async function getAllMemberCounts() {
  const allUsers = await db.select().from(users);
  const countMap = /* @__PURE__ */ new Map();
  for (const u of allUsers) {
    if (u.organizationId) {
      countMap.set(u.organizationId, (countMap.get(u.organizationId) ?? 0) + 1);
    }
  }
  return countMap;
}
__name(getAllMemberCounts, "getAllMemberCounts");
organizationsRoutes.get("/", jwtAuth, superAdminOnly, async (c) => {
  const [orgs, countMap] = await Promise.all([
    db.select().from(organizations),
    getAllMemberCounts()
  ]);
  const publicOrgs = orgs.map((org) => ({
    id: org.id,
    name: org.name,
    slug: org.slug,
    logoUrl: org.logoUrl ?? void 0,
    memberCount: countMap.get(org.id) ?? 0,
    createdAt: org.createdAt.toISOString(),
    updatedAt: org.updatedAt.toISOString()
  }));
  return c.json({ data: publicOrgs });
});
organizationsRoutes.get("/current", jwtAuth, withOrganization, async (c) => {
  const org = c.get("organization");
  if (!org) {
    return c.json({ error: { message: "No organization assigned" } }, 404);
  }
  const memberCount = await getMemberCount(org.id);
  const [fullOrg] = await db.select().from(organizations).where(eq(organizations.id, org.id)).limit(1);
  const publicOrg = {
    id: fullOrg.id,
    name: fullOrg.name,
    slug: fullOrg.slug,
    logoUrl: fullOrg.logoUrl ?? void 0,
    memberCount,
    createdAt: fullOrg.createdAt.toISOString(),
    updatedAt: fullOrg.updatedAt.toISOString()
  };
  return c.json({ data: publicOrg });
});
organizationsRoutes.get("/current/deployment", jwtAuth, withOrganization, async (c) => {
  const org = c.get("organization");
  const user = c.get("user");
  if (!org) {
    return c.json({ error: { message: "No organization assigned" } }, 404);
  }
  if (!user.isAdmin && !user.isSuperAdmin) {
    return c.json({ error: { message: "Forbidden" } }, 403);
  }
  const [fullOrg] = await db.select().from(organizations).where(eq(organizations.id, org.id)).limit(1);
  const hasLlmConfigured = Boolean(fullOrg.llmApiKey);
  return c.json({
    data: {
      webUiEnabled: fullOrg.webUiEnabled ?? false,
      desktopEnabled: fullOrg.desktopEnabled ?? true,
      hasLlmConfigured
    }
  });
});
organizationsRoutes.put("/current/deployment", jwtAuth, withOrganization, async (c) => {
  const org = c.get("organization");
  const user = c.get("user");
  if (!org) {
    return c.json({ error: { message: "No organization assigned" } }, 404);
  }
  if (!user.isAdmin && !user.isSuperAdmin) {
    return c.json({ error: { message: "Forbidden" } }, 403);
  }
  const body = await c.req.json();
  const [fullOrg] = await db.select().from(organizations).where(eq(organizations.id, org.id)).limit(1);
  if (body.webUiEnabled === true && !fullOrg.llmApiKey) {
    return c.json(
      {
        error: {
          message: "Cannot enable Web UI without LLM configuration",
          code: "LLM_NOT_CONFIGURED"
        }
      },
      400
    );
  }
  const now = /* @__PURE__ */ new Date();
  await db.update(organizations).set({
    webUiEnabled: body.webUiEnabled ?? fullOrg.webUiEnabled,
    desktopEnabled: body.desktopEnabled ?? fullOrg.desktopEnabled,
    updatedAt: now
  }).where(eq(organizations.id, org.id));
  const [updated] = await db.select().from(organizations).where(eq(organizations.id, org.id)).limit(1);
  return c.json({
    data: {
      webUiEnabled: updated.webUiEnabled ?? false,
      desktopEnabled: updated.desktopEnabled ?? true,
      hasLlmConfigured: Boolean(updated.llmApiKey)
    }
  });
});
organizationsRoutes.post("/", jwtAuth, superAdminOnly, async (c) => {
  const body = await c.req.json();
  if (!body.name) {
    return c.json({ error: { message: "Name is required" } }, 400);
  }
  const slug = body.slug || generateSlug(body.name);
  const existing = await db.select().from(organizations).where(eq(organizations.slug, slug)).limit(1);
  if (existing.length > 0) {
    return c.json({ error: { message: "Organization slug already exists" } }, 400);
  }
  const id = randomUUID6();
  const now = /* @__PURE__ */ new Date();
  await db.insert(organizations).values({
    id,
    name: body.name,
    slug,
    logoUrl: body.logoUrl,
    createdAt: now,
    updatedAt: now
  });
  const publicOrg = {
    id,
    name: body.name,
    slug,
    logoUrl: body.logoUrl,
    memberCount: 0,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString()
  };
  return c.json({ data: publicOrg }, 201);
});
organizationsRoutes.get("/:id", jwtAuth, async (c) => {
  const id = c.req.param("id");
  const user = c.get("user");
  if (!user.isSuperAdmin && user.organizationId !== id) {
    return c.json({ error: { message: "Forbidden" } }, 403);
  }
  const [org] = await db.select().from(organizations).where(eq(organizations.id, id)).limit(1);
  if (!org) {
    return c.json({ error: { message: "Organization not found" } }, 404);
  }
  const memberCount = await getMemberCount(id);
  const publicOrg = {
    id: org.id,
    name: org.name,
    slug: org.slug,
    logoUrl: org.logoUrl ?? void 0,
    memberCount,
    createdAt: org.createdAt.toISOString(),
    updatedAt: org.updatedAt.toISOString()
  };
  return c.json({ data: publicOrg });
});
organizationsRoutes.put("/:id", jwtAuth, async (c) => {
  const id = c.req.param("id");
  const user = c.get("user");
  const isOrgAdmin = user.isAdmin && user.organizationId === id;
  if (!user.isSuperAdmin && !isOrgAdmin) {
    return c.json({ error: { message: "Forbidden" } }, 403);
  }
  const [existing] = await db.select().from(organizations).where(eq(organizations.id, id)).limit(1);
  if (!existing) {
    return c.json({ error: { message: "Organization not found" } }, 404);
  }
  const body = await c.req.json();
  if (body.slug && body.slug !== existing.slug) {
    const slugExists = await db.select().from(organizations).where(eq(organizations.slug, body.slug)).limit(1);
    if (slugExists.length > 0) {
      return c.json({ error: { message: "Organization slug already exists" } }, 400);
    }
  }
  const now = /* @__PURE__ */ new Date();
  await db.update(organizations).set({
    name: body.name ?? existing.name,
    slug: body.slug ?? existing.slug,
    logoUrl: body.logoUrl !== void 0 ? body.logoUrl : existing.logoUrl,
    updatedAt: now
  }).where(eq(organizations.id, id));
  const [updated] = await db.select().from(organizations).where(eq(organizations.id, id)).limit(1);
  const memberCount = await getMemberCount(id);
  const publicOrg = {
    id: updated.id,
    name: updated.name,
    slug: updated.slug,
    logoUrl: updated.logoUrl ?? void 0,
    memberCount,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString()
  };
  return c.json({ data: publicOrg });
});
organizationsRoutes.delete("/:id", jwtAuth, superAdminOnly, async (c) => {
  const id = c.req.param("id");
  const [existing] = await db.select().from(organizations).where(eq(organizations.id, id)).limit(1);
  if (!existing) {
    return c.json({ error: { message: "Organization not found" } }, 404);
  }
  const memberCount = await getMemberCount(id);
  if (memberCount > 0) {
    return c.json(
      { error: { message: "Cannot delete organization with members. Remove all members first." } },
      400
    );
  }
  await db.delete(organizations).where(eq(organizations.id, id));
  return c.json({ data: { message: "Organization deleted" } });
});

// apps/api/src/routes/invites.ts
import { randomUUID as randomUUID7, randomBytes as randomBytes2 } from "crypto";
var invitesRoutes = new Hono2();
function generateInviteToken() {
  return randomBytes2(32).toString("hex");
}
__name(generateInviteToken, "generateInviteToken");
function getInviteStatus(acceptedAt, expiresAt) {
  if (acceptedAt) return "accepted";
  if (/* @__PURE__ */ new Date() > expiresAt) return "expired";
  return "pending";
}
__name(getInviteStatus, "getInviteStatus");
invitesRoutes.get("/", jwtAuth, orgAdminOnly, withOrganization, async (c) => {
  const user = c.get("user");
  const org = c.get("organization");
  let invitesWithOrg;
  if (user.isSuperAdmin) {
    invitesWithOrg = await db.select().from(organizationInvites).innerJoin(organizations, eq(organizationInvites.organizationId, organizations.id));
  } else if (org) {
    invitesWithOrg = await db.select().from(organizationInvites).innerJoin(organizations, eq(organizationInvites.organizationId, organizations.id)).where(eq(organizationInvites.organizationId, org.id));
  } else {
    return c.json({ data: [] });
  }
  const publicInvites = invitesWithOrg.map((row) => ({
    id: row.organization_invites.id,
    email: row.organization_invites.email,
    role: row.organization_invites.role,
    status: getInviteStatus(row.organization_invites.acceptedAt, row.organization_invites.expiresAt),
    organizationId: row.organizations.id,
    organizationName: row.organizations.name,
    expiresAt: row.organization_invites.expiresAt.toISOString(),
    createdAt: row.organization_invites.createdAt.toISOString()
  }));
  return c.json({ data: publicInvites });
});
invitesRoutes.post("/", jwtAuth, orgAdminOnly, withOrganization, async (c) => {
  const user = c.get("user");
  const currentOrg = c.get("organization");
  const body = await c.req.json();
  if (!body.email) {
    return c.json({ error: { message: "Email is required" } }, 400);
  }
  let targetOrgId = body.organizationId;
  if (!user.isSuperAdmin) {
    if (!currentOrg) {
      return c.json({ error: { message: "No organization assigned" } }, 400);
    }
    targetOrgId = currentOrg.id;
  }
  if (!targetOrgId) {
    return c.json({ error: { message: "Organization ID required" } }, 400);
  }
  const [targetOrg] = await db.select().from(organizations).where(eq(organizations.id, targetOrgId)).limit(1);
  if (!targetOrg) {
    return c.json({ error: { message: "Organization not found" } }, 404);
  }
  const existingUser = await db.select().from(users).where(eq(users.email, body.email.toLowerCase())).limit(1);
  if (existingUser.length > 0) {
    return c.json({ error: { message: "User already exists with this email" } }, 400);
  }
  const existingInvite = await db.select().from(organizationInvites).where(
    and(
      eq(organizationInvites.email, body.email.toLowerCase()),
      eq(organizationInvites.organizationId, targetOrgId),
      isNull(organizationInvites.acceptedAt),
      gt(organizationInvites.expiresAt, /* @__PURE__ */ new Date())
    )
  ).limit(1);
  if (existingInvite.length > 0) {
    return c.json({ error: { message: "Pending invite already exists for this email" } }, 400);
  }
  const id = randomUUID7();
  const token = generateInviteToken();
  const now = /* @__PURE__ */ new Date();
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1e3);
  await db.insert(organizationInvites).values({
    id,
    organizationId: targetOrgId,
    email: body.email.toLowerCase(),
    role: body.role ?? "member",
    token,
    invitedBy: user.sub,
    expiresAt,
    createdAt: now
  });
  const publicInvite = {
    id,
    email: body.email.toLowerCase(),
    role: body.role ?? "member",
    status: "pending",
    organizationId: targetOrgId,
    organizationName: targetOrg.name,
    expiresAt: expiresAt.toISOString(),
    createdAt: now.toISOString()
  };
  return c.json({ data: { ...publicInvite, token } }, 201);
});
invitesRoutes.get("/validate/:token", async (c) => {
  const token = c.req.param("token");
  const result = await db.select().from(organizationInvites).innerJoin(organizations, eq(organizationInvites.organizationId, organizations.id)).where(eq(organizationInvites.token, token)).limit(1);
  if (result.length === 0) {
    return c.json({ error: { message: "Invalid invite token" } }, 404);
  }
  const row = result[0];
  const invite = row.organization_invites;
  const org = row.organizations;
  if (invite.acceptedAt) {
    return c.json({ error: { message: "Invite already accepted" } }, 400);
  }
  if (/* @__PURE__ */ new Date() > invite.expiresAt) {
    return c.json({ error: { message: "Invite has expired" } }, 400);
  }
  return c.json({
    data: {
      valid: true,
      email: invite.email,
      organizationName: org.name,
      role: invite.role
    }
  });
});
invitesRoutes.post("/accept", async (c) => {
  const body = await c.req.json();
  if (!body.token || !body.password || !body.name) {
    return c.json({ error: { message: "Token, password, and name are required" } }, 400);
  }
  if (body.password.length < 8) {
    return c.json({ error: { message: "Password must be at least 8 characters" } }, 400);
  }
  const result = await db.select().from(organizationInvites).innerJoin(organizations, eq(organizationInvites.organizationId, organizations.id)).where(
    and(
      eq(organizationInvites.token, body.token),
      isNull(organizationInvites.acceptedAt),
      gt(organizationInvites.expiresAt, /* @__PURE__ */ new Date())
    )
  ).limit(1);
  if (result.length === 0) {
    return c.json({ error: { message: "Invalid or expired invite" } }, 400);
  }
  const row = result[0];
  const invite = row.organization_invites;
  const org = row.organizations;
  const existingUser = await db.select().from(users).where(eq(users.email, invite.email)).limit(1);
  if (existingUser.length > 0) {
    return c.json({ error: { message: "User already exists with this email" } }, 400);
  }
  const userId = randomUUID7();
  const now = /* @__PURE__ */ new Date();
  await db.insert(users).values({
    id: userId,
    email: invite.email,
    passwordHash: R(body.password, 10),
    name: body.name,
    organizationId: invite.organizationId,
    isAdmin: invite.role === "admin",
    isSuperAdmin: false,
    createdAt: now,
    updatedAt: now
  });
  await db.update(organizationInvites).set({ acceptedAt: now }).where(eq(organizationInvites.id, invite.id));
  const userPublic = {
    id: userId,
    email: invite.email,
    name: body.name,
    isAdmin: invite.role === "admin",
    isSuperAdmin: false,
    organizationId: invite.organizationId,
    organizationName: org.name,
    onboardingStep: 0
  };
  const jwtToken = await createToken(userPublic);
  return c.json({
    data: {
      token: jwtToken,
      user: userPublic
    }
  });
});
invitesRoutes.delete("/:id", jwtAuth, orgAdminOnly, withOrganization, async (c) => {
  const id = c.req.param("id");
  const user = c.get("user");
  const org = c.get("organization");
  const [invite] = await db.select().from(organizationInvites).where(eq(organizationInvites.id, id)).limit(1);
  if (!invite) {
    return c.json({ error: { message: "Invite not found" } }, 404);
  }
  if (!user.isSuperAdmin && invite.organizationId !== org?.id) {
    return c.json({ error: { message: "Forbidden" } }, 403);
  }
  if (invite.acceptedAt) {
    return c.json({ error: { message: "Cannot cancel accepted invite" } }, 400);
  }
  await db.delete(organizationInvites).where(eq(organizationInvites.id, id));
  return c.json({ data: { message: "Invite cancelled" } });
});

// apps/api/src/routes/webhooks.ts
var webhooksRoutes = new Hono2();
webhooksRoutes.post("/nango", async (c) => {
  try {
    const payload = await c.req.json();
    console.log("[Nango Webhook] Received:", JSON.stringify(payload, null, 2));
    if (payload.type === "auth") {
      const authPayload = payload;
      if (authPayload.operation === "creation") {
        if (authPayload.success && authPayload.endUser?.endUserId) {
          const userId = authPayload.endUser.endUserId;
          const provider = authPayload.provider;
          console.log(`[Nango Webhook] Connection created for user ${userId}, provider ${provider}`);
          const result = await db.update(integrations).set({
            status: "connected",
            nangoConnectionId: authPayload.connectionId,
            lastSyncAt: /* @__PURE__ */ new Date(),
            updatedAt: /* @__PURE__ */ new Date()
          }).where(eq(integrations.userId, userId));
          console.log(`[Nango Webhook] Updated integration:`, result);
          const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
          if (user && user.onboardingStep < ONBOARDING_STEPS.ATS_CONNECTED) {
            await db.update(users).set({
              onboardingStep: ONBOARDING_STEPS.ATS_CONNECTED,
              updatedAt: /* @__PURE__ */ new Date()
            }).where(eq(users.id, userId));
            console.log(`[Nango Webhook] Advanced onboarding for user ${userId} to ATS_CONNECTED`);
          }
        } else if (!authPayload.success) {
          console.error("[Nango Webhook] Connection creation failed:", authPayload.error);
        }
      } else if (authPayload.operation === "refresh") {
        if (!authPayload.success) {
          console.error("[Nango Webhook] Token refresh failed:", authPayload.error);
          if (authPayload.connectionId) {
            await db.update(integrations).set({
              status: "error",
              updatedAt: /* @__PURE__ */ new Date()
            }).where(eq(integrations.nangoConnectionId, authPayload.connectionId));
          }
        }
      }
    }
    return c.json({ received: true });
  } catch (error) {
    console.error("[Nango Webhook] Error processing webhook:", error);
    return c.json({ received: true, error: "Processing error" });
  }
});

// apps/api/src/middleware/apiKey.ts
var apiKeyAuth = createMiddleware(async (c, next) => {
  const authHeader = c.req.header("Authorization");
  const key = extractApiKey(authHeader);
  if (!key) {
    return c.json({ error: { message: "Missing or invalid API key" } }, 401);
  }
  const result = await db.select().from(apiKeys).innerJoin(users, eq(apiKeys.userId, users.id)).where(
    and(
      eq(apiKeys.key, key),
      isNull(apiKeys.revokedAt)
    )
  ).limit(1);
  if (result.length === 0) {
    return c.json({ error: { message: "Invalid or revoked API key" } }, 401);
  }
  const row = result[0];
  const apiKey = row.api_keys;
  const user = row.users;
  db.update(apiKeys).set({ lastUsedAt: /* @__PURE__ */ new Date() }).where(eq(apiKeys.id, apiKey.id)).execute().catch(console.error);
  c.set("apiKeyUser", {
    id: user.id,
    email: user.email,
    name: user.name,
    isAdmin: user.isAdmin,
    isSuperAdmin: user.isSuperAdmin ?? false,
    organizationId: user.organizationId ?? null,
    apiKeyId: apiKey.id,
    onboardingStep: user.onboardingStep ?? 0
  });
  await next();
});

// apps/api/src/routes/v1/ats.ts
import { randomUUID as randomUUID8 } from "crypto";

// apps/api/src/lib/zoho-recruit.ts
var ZOHO_RECRUIT_BASE_URL = "https://recruit.zoho.com/recruit/v2";
var ZohoRecruitClient = class {
  static {
    __name(this, "ZohoRecruitClient");
  }
  accessToken;
  baseUrl;
  constructor(accessToken, region = "us") {
    this.accessToken = accessToken;
    this.baseUrl = this.getBaseUrl(region);
  }
  getBaseUrl(region) {
    switch (region) {
      case "eu":
        return "https://recruit.zoho.eu/recruit/v2";
      case "cn":
        return "https://recruit.zoho.com.cn/recruit/v2";
      default:
        return ZOHO_RECRUIT_BASE_URL;
    }
  }
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Zoho-oauthtoken ${this.accessToken}`,
        "Content-Type": "application/json",
        ...options.headers
      }
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      const message2 = error.message || error.code || `Zoho API error: ${response.status}`;
      throw new Error(message2);
    }
    return response.json();
  }
  // ============ Candidates ============
  async getCandidates(params) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set("page", String(params.page));
    if (params?.perPage) queryParams.set("per_page", String(params.perPage));
    if (params?.sortBy) queryParams.set("sort_by", params.sortBy);
    if (params?.sortOrder) queryParams.set("sort_order", params.sortOrder);
    let endpoint = "/Candidates";
    if (params?.search) {
      endpoint = "/Candidates/search";
      queryParams.set(
        "criteria",
        `((First_Name:contains:${params.search})or(Last_Name:contains:${params.search})or(Email:contains:${params.search}))`
      );
    }
    const query = queryParams.toString();
    const url = query ? `${endpoint}?${query}` : endpoint;
    try {
      const response = await this.request(url);
      return {
        candidates: response.data.map(this.mapCandidate),
        total: response.info.count,
        hasMore: response.info.more_records
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes("no matching record")) {
        return { candidates: [], total: 0, hasMore: false };
      }
      throw error;
    }
  }
  async getCandidate(id) {
    try {
      const response = await this.request(
        `/Candidates/${id}`
      );
      if (response.data.length === 0) return null;
      return this.mapCandidate(response.data[0]);
    } catch {
      return null;
    }
  }
  async createCandidate(candidate) {
    const zohoData = {
      data: [
        {
          First_Name: candidate.firstName,
          Last_Name: candidate.lastName,
          Email: candidate.email,
          Phone: candidate.phone,
          Current_Job_Title: candidate.headline,
          City: candidate.location?.city,
          State: candidate.location?.state,
          Country: candidate.location?.country,
          Source: this.mapSourceToZoho(candidate.source)
        }
      ]
    };
    const response = await this.request("/Candidates", {
      method: "POST",
      body: JSON.stringify(zohoData)
    });
    if (response.data[0]?.code === "SUCCESS") {
      return this.mapCandidate(response.data[0].details);
    }
    return null;
  }
  async updateCandidate(id, updates) {
    const zohoData = {
      data: [
        {
          id,
          First_Name: updates.firstName,
          Last_Name: updates.lastName,
          Email: updates.email,
          Phone: updates.phone,
          Current_Job_Title: updates.headline,
          City: updates.location?.city,
          State: updates.location?.state,
          Country: updates.location?.country
        }
      ]
    };
    const response = await this.request("/Candidates", {
      method: "PUT",
      body: JSON.stringify(zohoData)
    });
    if (response.data[0]?.code === "SUCCESS") {
      return this.getCandidate(id);
    }
    return null;
  }
  mapCandidate(zoho) {
    return {
      id: zoho.id,
      firstName: zoho.First_Name || "",
      lastName: zoho.Last_Name || "",
      email: zoho.Email || "",
      phone: zoho.Phone || zoho.Mobile,
      headline: zoho.Current_Job_Title,
      summary: void 0,
      location: zoho.City || zoho.Country ? {
        city: zoho.City || "",
        state: zoho.State,
        country: zoho.Country || ""
      } : void 0,
      source: this.mapSource(zoho.Source),
      sourceDetail: zoho.Source_Name,
      attachments: [],
      // Zoho attachments require separate API call
      tags: zoho.Skill_Set ? zoho.Skill_Set.split(",").map((s) => s.trim()) : [],
      createdAt: zoho.Created_Time || (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: zoho.Modified_Time || (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  mapSource(zohoSource) {
    const source = zohoSource?.toLowerCase() || "";
    if (source.includes("referral")) return "referral";
    if (source.includes("agency") || source.includes("recruiter"))
      return "agency";
    if (source.includes("sourced") || source.includes("linkedin"))
      return "sourced";
    return "applied";
  }
  mapSourceToZoho(source) {
    switch (source) {
      case "referral":
        return "Employee Referral";
      case "agency":
        return "External Referral";
      case "sourced":
        return "LinkedIn";
      default:
        return "Career Site";
    }
  }
  // ============ Jobs ============
  async getJobs(params) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set("page", String(params.page));
    if (params?.perPage) queryParams.set("per_page", String(params.perPage));
    let endpoint = "/Job_Openings";
    if (params?.status) {
      endpoint = "/Job_Openings/search";
      queryParams.set("criteria", `(Job_Opening_Status:equals:${params.status})`);
    }
    const query = queryParams.toString();
    const url = query ? `${endpoint}?${query}` : endpoint;
    try {
      const response = await this.request(url);
      return {
        jobs: response.data.map(this.mapJob.bind(this)),
        total: response.info.count,
        hasMore: response.info.more_records
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes("no matching record")) {
        return { jobs: [], total: 0, hasMore: false };
      }
      throw error;
    }
  }
  async getJob(id) {
    try {
      const response = await this.request(
        `/Job_Openings/${id}`
      );
      if (response.data.length === 0) return null;
      return this.mapJob(response.data[0]);
    } catch {
      return null;
    }
  }
  mapJob(zoho) {
    const location = [zoho.City, zoho.State, zoho.Country].filter(Boolean).join(", ");
    return {
      id: zoho.id,
      title: zoho.Posting_Title || zoho.Job_Opening_Name || "",
      department: zoho.Department_Name || "",
      location: location || "Remote",
      employmentType: this.mapEmploymentType(zoho.Job_Type),
      description: zoho.Job_Description || "",
      requirements: zoho.Required_Skills ? zoho.Required_Skills.split(",").map((s) => s.trim()) : [],
      niceToHave: [],
      salary: zoho.Min_Salary || zoho.Max_Salary ? {
        min: zoho.Min_Salary || 0,
        max: zoho.Max_Salary || 0,
        currency: "USD"
      } : void 0,
      status: this.mapJobStatus(zoho.Job_Opening_Status),
      hiringManagerId: zoho.Hiring_Manager?.id || "",
      recruiterId: zoho.Recruiter?.id || "",
      openDate: zoho.Date_Opened || zoho.Created_Time || (/* @__PURE__ */ new Date()).toISOString(),
      closeDate: zoho.Target_Date,
      createdAt: zoho.Created_Time || (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: zoho.Modified_Time || (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  mapEmploymentType(zohoType) {
    const type = zohoType?.toLowerCase() || "";
    if (type.includes("part")) return "part-time";
    if (type.includes("contract") || type.includes("temp")) return "contract";
    if (type.includes("intern")) return "intern";
    return "full-time";
  }
  mapJobStatus(zohoStatus) {
    const status = zohoStatus?.toLowerCase() || "";
    if (status.includes("closed") || status.includes("cancelled"))
      return "closed";
    if (status.includes("hold") || status.includes("paused")) return "on-hold";
    if (status.includes("filled")) return "filled";
    return "open";
  }
  // ============ Applications ============
  async getApplications(params) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set("page", String(params.page));
    if (params?.perPage) queryParams.set("per_page", String(params.perPage));
    let endpoint = "/Candidates";
    if (params?.candidateId) {
      endpoint = `/Candidates/${params.candidateId}/Job_Openings`;
    } else if (params?.jobId) {
      endpoint = `/Job_Openings/${params.jobId}/Candidates`;
    }
    const query = queryParams.toString();
    const url = query ? `${endpoint}?${query}` : endpoint;
    try {
      const response = await this.request(
        url
      );
      return {
        applications: response.data.map(this.mapApplication.bind(this)),
        total: response.info.count,
        hasMore: response.info.more_records
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes("no matching record")) {
        return { applications: [], total: 0, hasMore: false };
      }
      throw error;
    }
  }
  async updateApplicationStage(applicationId, stage) {
    const zohoData = {
      data: [
        {
          id: applicationId,
          Candidate_Status: stage
        }
      ]
    };
    try {
      await this.request("/Candidates", {
        method: "PUT",
        body: JSON.stringify(zohoData)
      });
      return null;
    } catch {
      return null;
    }
  }
  mapApplication(zoho) {
    return {
      id: zoho.id,
      candidateId: zoho.Candidate_ID?.id || zoho.id,
      jobId: zoho.Job_Opening_ID?.id || "",
      status: this.mapApplicationStatus(zoho.Candidate_Status),
      stage: zoho.Stage || zoho.Candidate_Status || "New",
      stageHistory: [],
      appliedAt: zoho.Applied_Date || zoho.Created_Time || (/* @__PURE__ */ new Date()).toISOString(),
      rejectedAt: zoho.Rejected_Date,
      rejectionReason: zoho.Rejection_Reason,
      createdAt: zoho.Created_Time || (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: zoho.Modified_Time || (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  mapApplicationStatus(zohoStatus) {
    const status = zohoStatus?.toLowerCase() || "";
    if (status.includes("new") || status.includes("received")) return "new";
    if (status.includes("screen")) return "screening";
    if (status.includes("interview")) return "interview";
    if (status.includes("offer")) return "offer";
    if (status.includes("hired") || status.includes("joined")) return "hired";
    if (status.includes("reject")) return "rejected";
    return "new";
  }
};

// apps/api/src/routes/v1/ats.ts
var v1AtsRoutes = new Hono2();
v1AtsRoutes.use("*", apiKeyAuth);
var MOCK_ATS_URL = process.env.MOCK_ATS_URL || "http://localhost:3001";
var USE_ZOHO = process.env.USE_ZOHO_ATS === "true";
async function getZohoClient(userId, organizationId) {
  const conditions = organizationId ? and(eq(integrations.organizationId, organizationId), eq(integrations.provider, "ats")) : and(eq(integrations.userId, userId), eq(integrations.provider, "ats"));
  const integration = await db.select().from(integrations).where(conditions).limit(1);
  if (integration.length === 0 || integration[0].status !== "connected") {
    return null;
  }
  const int = integration[0];
  if (!int.nangoConnectionId) {
    return null;
  }
  try {
    const nango = getNangoClient();
    const metadata = int.metadata ? JSON.parse(int.metadata) : {};
    const providerKey = metadata.subProvider || "zoho-recruit";
    const providerConfigKey = PROVIDER_CONFIG_KEYS[providerKey] || "zoho-recruit";
    const token = await nango.getToken(providerConfigKey, int.nangoConnectionId);
    const region = metadata.zohoRegion || "us";
    return new ZohoRecruitClient(token.access_token, region);
  } catch (error) {
    console.error("Failed to get Zoho token:", error);
    return null;
  }
}
__name(getZohoClient, "getZohoClient");
function classifyAtsError(error) {
  const message2 = error instanceof Error ? error.message : String(error);
  const lowerMessage = message2.toLowerCase();
  if (lowerMessage.includes("fetch") || lowerMessage.includes("network") || lowerMessage.includes("econnrefused") || lowerMessage.includes("connection")) {
    return "NETWORK_ERROR";
  }
  if (lowerMessage.includes("timeout") || lowerMessage.includes("timed out")) {
    return "ATS_TIMEOUT";
  }
  if (lowerMessage.includes("unauthorized") || lowerMessage.includes("401") || lowerMessage.includes("authentication") || lowerMessage.includes("forbidden")) {
    return "ATS_AUTH_FAILED";
  }
  if (lowerMessage.includes("rate limit") || lowerMessage.includes("429") || lowerMessage.includes("too many requests")) {
    return "ATS_RATE_LIMITED";
  }
  if (lowerMessage.includes("not found") || lowerMessage.includes("404")) {
    return "ATS_NOT_FOUND";
  }
  if (lowerMessage.includes("invalid") || lowerMessage.includes("400") || lowerMessage.includes("bad request")) {
    return "ATS_INVALID_REQUEST";
  }
  return "UNKNOWN_ERROR";
}
__name(classifyAtsError, "classifyAtsError");
async function logUsage(userId, apiKeyId, skillSlug, status, durationMs, errorCode) {
  try {
    const skill = await db.select().from(skills).where(eq(skills.slug, skillSlug)).limit(1);
    if (skill.length > 0) {
      await db.insert(skillUsageLogs).values({
        id: randomUUID8(),
        skillId: skill[0].id,
        userId,
        apiKeyId,
        status,
        durationMs,
        errorMessage: errorCode
        // Store error code (no PII)
      });
    }
  } catch (err) {
    console.error("Failed to log usage:", err);
  }
}
__name(logUsage, "logUsage");
async function proxyToMockAts(path, options) {
  const url = `${MOCK_ATS_URL}${path}`;
  const response = await fetch(url, options);
  return response.json();
}
__name(proxyToMockAts, "proxyToMockAts");
v1AtsRoutes.get("/candidates", async (c) => {
  const query = c.req.query();
  const params = new URLSearchParams(query);
  const user = c.get("apiKeyUser");
  const startTime = Date.now();
  if (isDemoMode(c.req.raw)) {
    const candidates = generateDemoCandidates();
    let filtered = candidates;
    const search = query.q || query.search;
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (c2) => c2.firstName.toLowerCase().includes(q) || c2.lastName.toLowerCase().includes(q) || c2.title.toLowerCase().includes(q) || c2.company.toLowerCase().includes(q) || c2.skills.some((s) => s.toLowerCase().includes(q))
      );
    }
    if (query.status) {
      filtered = filtered.filter((c2) => c2.status === query.status);
    }
    if (query.stage) {
      filtered = filtered.filter((c2) => c2.stage === query.stage);
    }
    logUsage(user.id, user.apiKeyId, "ats-candidate-search", "success", Date.now() - startTime);
    return c.json({ candidates: filtered, total: filtered.length, demo: true });
  }
  if (USE_ZOHO) {
    const zoho = await getZohoClient(user.id, user.organizationId);
    if (zoho) {
      try {
        const search = query.q || query.search;
        const page = query.page ? parseInt(query.page) : 1;
        const perPage = query.per_page ? parseInt(query.per_page) : 50;
        const result = await zoho.getCandidates({ search, page, perPage });
        logUsage(user.id, user.apiKeyId, "ats-candidate-search", "success", Date.now() - startTime);
        return c.json({ candidates: result.candidates, total: result.total, hasMore: result.hasMore });
      } catch (error) {
        logUsage(user.id, user.apiKeyId, "ats-candidate-search", "error", Date.now() - startTime, classifyAtsError(error));
        return c.json({ error: { message: "Failed to fetch candidates from Zoho Recruit" } }, 502);
      }
    }
  }
  try {
    const data = await proxyToMockAts(`/api/candidates?${params}`);
    logUsage(user.id, user.apiKeyId, "ats-candidate-search", "success", Date.now() - startTime);
    return c.json(data);
  } catch (error) {
    logUsage(user.id, user.apiKeyId, "ats-candidate-search", "error", Date.now() - startTime, classifyAtsError(error));
    return c.json({ error: { message: "Failed to fetch candidates from ATS" } }, 502);
  }
});
v1AtsRoutes.get("/candidates/:id", async (c) => {
  const id = c.req.param("id");
  const user = c.get("apiKeyUser");
  const startTime = Date.now();
  if (isDemoMode(c.req.raw)) {
    const candidates = generateDemoCandidates();
    const candidate = candidates.find((c2) => c2.id === id);
    if (!candidate) {
      return c.json({ error: { message: "Candidate not found" } }, 404);
    }
    logUsage(user.id, user.apiKeyId, "ats-candidate-crud", "success", Date.now() - startTime);
    return c.json({ candidate, demo: true });
  }
  if (USE_ZOHO) {
    const zoho = await getZohoClient(user.id, user.organizationId);
    if (zoho) {
      try {
        const candidate = await zoho.getCandidate(id);
        if (!candidate) {
          return c.json({ error: { message: "Candidate not found" } }, 404);
        }
        logUsage(user.id, user.apiKeyId, "ats-candidate-crud", "success", Date.now() - startTime);
        return c.json({ candidate });
      } catch (error) {
        logUsage(user.id, user.apiKeyId, "ats-candidate-crud", "error", Date.now() - startTime, classifyAtsError(error));
        return c.json({ error: { message: "Failed to fetch candidate from Zoho Recruit" } }, 502);
      }
    }
  }
  try {
    const data = await proxyToMockAts(`/api/candidates/${id}`);
    logUsage(user.id, user.apiKeyId, "ats-candidate-crud", "success", Date.now() - startTime);
    return c.json(data);
  } catch (error) {
    logUsage(user.id, user.apiKeyId, "ats-candidate-crud", "error", Date.now() - startTime, classifyAtsError(error));
    return c.json({ error: { message: "Failed to fetch candidate from ATS" } }, 502);
  }
});
v1AtsRoutes.post("/candidates", async (c) => {
  const body = await c.req.json();
  const user = c.get("apiKeyUser");
  const startTime = Date.now();
  if (isDemoMode(c.req.raw)) {
    const newCandidate = {
      id: `demo-cand-new-${Date.now()}`,
      ...body,
      status: body.status || "active",
      stage: body.stage || "New",
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    logUsage(user.id, user.apiKeyId, "ats-candidate-crud", "success", Date.now() - startTime);
    return c.json({ candidate: newCandidate, demo: true }, 201);
  }
  if (USE_ZOHO) {
    const zoho = await getZohoClient(user.id, user.organizationId);
    if (zoho) {
      try {
        const candidate = await zoho.createCandidate(body);
        if (!candidate) {
          return c.json({ error: { message: "Failed to create candidate" } }, 400);
        }
        logUsage(user.id, user.apiKeyId, "ats-candidate-crud", "success", Date.now() - startTime);
        return c.json({ candidate }, 201);
      } catch (error) {
        logUsage(user.id, user.apiKeyId, "ats-candidate-crud", "error", Date.now() - startTime, classifyAtsError(error));
        return c.json({ error: { message: "Failed to create candidate in Zoho Recruit" } }, 502);
      }
    }
  }
  try {
    const data = await proxyToMockAts("/api/candidates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    logUsage(user.id, user.apiKeyId, "ats-candidate-crud", "success", Date.now() - startTime);
    return c.json(data, 201);
  } catch (error) {
    logUsage(user.id, user.apiKeyId, "ats-candidate-crud", "error", Date.now() - startTime, classifyAtsError(error));
    return c.json({ error: { message: "Failed to create candidate in ATS" } }, 502);
  }
});
v1AtsRoutes.put("/candidates/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const user = c.get("apiKeyUser");
  const startTime = Date.now();
  if (isDemoMode(c.req.raw)) {
    const candidates = generateDemoCandidates();
    const candidate = candidates.find((c2) => c2.id === id);
    if (!candidate) {
      return c.json({ error: { message: "Candidate not found" } }, 404);
    }
    const updated = { ...candidate, ...body, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
    logUsage(user.id, user.apiKeyId, "ats-candidate-crud", "success", Date.now() - startTime);
    return c.json({ candidate: updated, demo: true });
  }
  if (USE_ZOHO) {
    const zoho = await getZohoClient(user.id, user.organizationId);
    if (zoho) {
      try {
        const candidate = await zoho.updateCandidate(id, body);
        if (!candidate) {
          return c.json({ error: { message: "Failed to update candidate" } }, 400);
        }
        logUsage(user.id, user.apiKeyId, "ats-candidate-crud", "success", Date.now() - startTime);
        return c.json({ candidate });
      } catch (error) {
        logUsage(user.id, user.apiKeyId, "ats-candidate-crud", "error", Date.now() - startTime, classifyAtsError(error));
        return c.json({ error: { message: "Failed to update candidate in Zoho Recruit" } }, 502);
      }
    }
  }
  try {
    const data = await proxyToMockAts(`/api/candidates/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    logUsage(user.id, user.apiKeyId, "ats-candidate-crud", "success", Date.now() - startTime);
    return c.json(data);
  } catch (error) {
    logUsage(user.id, user.apiKeyId, "ats-candidate-crud", "error", Date.now() - startTime, classifyAtsError(error));
    return c.json({ error: { message: "Failed to update candidate in ATS" } }, 502);
  }
});
v1AtsRoutes.get("/jobs", async (c) => {
  const query = c.req.query();
  const user = c.get("apiKeyUser");
  if (isDemoMode(c.req.raw)) {
    const jobs = generateDemoJobs();
    return c.json({ jobs, total: jobs.length, demo: true });
  }
  if (USE_ZOHO) {
    const zoho = await getZohoClient(user.id, user.organizationId);
    if (zoho) {
      try {
        const page = query.page ? parseInt(query.page) : 1;
        const perPage = query.per_page ? parseInt(query.per_page) : 50;
        const result = await zoho.getJobs({ page, perPage, status: query.status });
        return c.json({ jobs: result.jobs, total: result.total, hasMore: result.hasMore });
      } catch (error) {
        return c.json({ error: { message: "Failed to fetch jobs from Zoho Recruit" } }, 502);
      }
    }
  }
  try {
    const data = await proxyToMockAts("/api/jobs");
    return c.json(data);
  } catch (error) {
    return c.json({ error: { message: "Failed to fetch jobs from ATS" } }, 502);
  }
});
v1AtsRoutes.get("/jobs/:id", async (c) => {
  const id = c.req.param("id");
  const user = c.get("apiKeyUser");
  if (isDemoMode(c.req.raw)) {
    const jobs = generateDemoJobs();
    const job = jobs.find((j2) => j2.id === id);
    if (!job) {
      return c.json({ error: { message: "Job not found" } }, 404);
    }
    return c.json({ job, demo: true });
  }
  if (USE_ZOHO) {
    const zoho = await getZohoClient(user.id, user.organizationId);
    if (zoho) {
      try {
        const job = await zoho.getJob(id);
        if (!job) {
          return c.json({ error: { message: "Job not found" } }, 404);
        }
        return c.json({ job });
      } catch (error) {
        return c.json({ error: { message: "Failed to fetch job from Zoho Recruit" } }, 502);
      }
    }
  }
  try {
    const data = await proxyToMockAts(`/api/jobs/${id}`);
    return c.json(data);
  } catch (error) {
    return c.json({ error: { message: "Failed to fetch job from ATS" } }, 502);
  }
});
v1AtsRoutes.get("/applications", async (c) => {
  const query = c.req.query();
  const params = new URLSearchParams(query);
  const user = c.get("apiKeyUser");
  if (isDemoMode(c.req.raw)) {
    let applications = generateDemoApplications();
    if (query.candidateId) {
      applications = applications.filter((a) => a.candidateId === query.candidateId);
    }
    if (query.jobId) {
      applications = applications.filter((a) => a.jobId === query.jobId);
    }
    if (query.stage) {
      applications = applications.filter((a) => a.stage === query.stage);
    }
    return c.json({ applications, total: applications.length, demo: true });
  }
  if (USE_ZOHO) {
    const zoho = await getZohoClient(user.id, user.organizationId);
    if (zoho) {
      try {
        const page = query.page ? parseInt(query.page) : 1;
        const perPage = query.per_page ? parseInt(query.per_page) : 50;
        const result = await zoho.getApplications({
          candidateId: query.candidateId,
          jobId: query.jobId,
          page,
          perPage
        });
        return c.json({ applications: result.applications, total: result.total, hasMore: result.hasMore });
      } catch (error) {
        return c.json({ error: { message: "Failed to fetch applications from Zoho Recruit" } }, 502);
      }
    }
  }
  try {
    const data = await proxyToMockAts(`/api/applications?${params}`);
    return c.json(data);
  } catch (error) {
    return c.json({ error: { message: "Failed to fetch applications from ATS" } }, 502);
  }
});
v1AtsRoutes.post("/applications/:id/stage", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const user = c.get("apiKeyUser");
  if (isDemoMode(c.req.raw)) {
    const applications = generateDemoApplications();
    const application = applications.find((a) => a.id === id);
    if (!application) {
      return c.json({ error: { message: "Application not found" } }, 404);
    }
    const updated = {
      ...application,
      stage: body.stage,
      stageHistory: [
        ...application.stageHistory,
        { stage: body.stage, date: (/* @__PURE__ */ new Date()).toISOString() }
      ],
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    return c.json({ application: updated, demo: true });
  }
  if (USE_ZOHO) {
    const zoho = await getZohoClient(user.id, user.organizationId);
    if (zoho) {
      try {
        const application = await zoho.updateApplicationStage(id, body.stage);
        return c.json({ application, success: true });
      } catch (error) {
        return c.json({ error: { message: "Failed to update application stage in Zoho Recruit" } }, 502);
      }
    }
  }
  try {
    const data = await proxyToMockAts(`/api/applications/${id}/stage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    return c.json(data);
  } catch (error) {
    return c.json({ error: { message: "Failed to update application stage in ATS" } }, 502);
  }
});

// apps/api/src/routes/v1/me.ts
var v1MeRoutes = new Hono2();
v1MeRoutes.use("*", apiKeyAuth);
v1MeRoutes.get("/", async (c) => {
  const user = c.get("apiKeyUser");
  if (user.organizationId) {
    const [org] = await db.select().from(organizations).where(eq(organizations.id, user.organizationId)).limit(1);
    if (org?.desktopEnabled && user.onboardingStep < ONBOARDING_STEPS.DEPLOYMENT_CONFIGURED) {
      await db.update(users).set({
        onboardingStep: ONBOARDING_STEPS.DEPLOYMENT_CONFIGURED,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(users.id, user.id));
    }
  }
  return c.json({
    data: {
      id: user.id,
      email: user.email,
      name: user.name,
      isAdmin: user.isAdmin,
      // Phase 2: permissions would be looked up from user_roles + role_permissions
      permissions: user.isAdmin ? ["admin:*"] : ["skills:read", "skills:execute", "candidates:read", "candidates:write"]
    }
  });
});

// apps/api/src/routes/v1/scrape.ts
init_scrape_events();
import { randomUUID as randomUUID9, createHash as createHash2 } from "crypto";
var v1ScrapeRoutes = new Hono2();
v1ScrapeRoutes.use("*", apiKeyAuth);
var TASK_TTL_MS = 60 * 60 * 1e3;
var CACHE_TTL_MS = 24 * 60 * 60 * 1e3;
var STALL_THRESHOLD_MS = 30 * 1e3;
var PROCESSING_TIMEOUT_MS = 2 * 60 * 1e3;
var ALLOWED_DOMAINS = ["www.linkedin.com", "linkedin.com"];
function isAllowedUrl(urlString) {
  try {
    const url = new URL(urlString);
    return ALLOWED_DOMAINS.includes(url.hostname.toLowerCase());
  } catch {
    return false;
  }
}
__name(isAllowedUrl, "isAllowedUrl");
function normalizeUrl2(urlString) {
  const url = new URL(urlString);
  url.protocol = url.protocol.toLowerCase();
  url.hostname = url.hostname.toLowerCase();
  if (url.protocol === "http:" && url.port === "80" || url.protocol === "https:" && url.port === "443") {
    url.port = "";
  }
  if (url.pathname.length > 1 && url.pathname.endsWith("/")) {
    url.pathname = url.pathname.slice(0, -1);
  }
  const trackingParams = [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
    "fbclid",
    "gclid",
    "msclkid",
    "ref",
    "source"
  ];
  trackingParams.forEach((param) => url.searchParams.delete(param));
  url.searchParams.sort();
  url.hash = "";
  return url.toString();
}
__name(normalizeUrl2, "normalizeUrl");
function hashUrl2(normalizedUrl) {
  return createHash2("sha256").update(normalizedUrl).digest("hex");
}
__name(hashUrl2, "hashUrl");
function formatTask(task) {
  const now = Date.now();
  const createdAtMs = task.createdAt.getTime();
  const waitTime = now - createdAtMs;
  let suggestion;
  if (task.status === "pending" && waitTime > STALL_THRESHOLD_MS) {
    suggestion = "No Skillomatic Scraper extension detected. Install it and ensure it's configured with your API key.";
  } else if (task.status === "failed" && !task.errorMessage) {
    suggestion = "Task failed unexpectedly. Check extension status in browser toolbar.";
  } else if (task.status === "processing" && task.claimedAt) {
    const processingTime = now - task.claimedAt.getTime();
    if (processingTime > PROCESSING_TIMEOUT_MS) {
      suggestion = "Extension may have disconnected during scrape. Please check your browser and try again.";
    }
  }
  return {
    id: task.id,
    url: task.url,
    status: task.status,
    result: task.result || void 0,
    errorMessage: task.errorMessage || void 0,
    suggestion,
    createdAt: task.createdAt.toISOString(),
    claimedAt: task.claimedAt?.toISOString(),
    completedAt: task.completedAt?.toISOString()
  };
}
__name(formatTask, "formatTask");
v1ScrapeRoutes.post("/tasks", async (c) => {
  const user = c.get("apiKeyUser");
  const body = await c.req.json();
  const forceRefresh = c.req.query("refresh") === "true";
  if (!body.url) {
    return c.json({ error: { message: "URL is required" } }, 400);
  }
  if (!isAllowedUrl(body.url)) {
    return c.json({
      error: {
        message: "Only LinkedIn URLs are supported. The scrape API is restricted to linkedin.com domains."
      }
    }, 400);
  }
  let normalizedUrl;
  let urlHash;
  try {
    normalizedUrl = normalizeUrl2(body.url);
    urlHash = hashUrl2(normalizedUrl);
  } catch {
    return c.json({ error: { message: "Invalid URL format" } }, 400);
  }
  const now = /* @__PURE__ */ new Date();
  const cacheThreshold = new Date(now.getTime() - CACHE_TTL_MS);
  if (!forceRefresh) {
    const [cached] = await db.select().from(scrapeTasks).where(
      and(
        eq(scrapeTasks.userId, user.id),
        eq(scrapeTasks.urlHash, urlHash),
        eq(scrapeTasks.status, "completed"),
        gt(scrapeTasks.completedAt, cacheThreshold)
      )
    ).orderBy(desc(scrapeTasks.completedAt)).limit(1);
    if (cached) {
      const response2 = formatTask(cached);
      return c.json({ ...response2, cached: true }, 200);
    }
    const [inProgress] = await db.select().from(scrapeTasks).where(
      and(
        eq(scrapeTasks.userId, user.id),
        eq(scrapeTasks.urlHash, urlHash),
        gt(scrapeTasks.expiresAt, now)
      )
    ).orderBy(desc(scrapeTasks.createdAt)).limit(1);
    if (inProgress && ["pending", "processing"].includes(inProgress.status)) {
      return c.json(formatTask(inProgress), 200);
    }
  }
  const taskId = randomUUID9();
  const [task] = await db.insert(scrapeTasks).values({
    id: taskId,
    userId: user.id,
    apiKeyId: user.apiKeyId,
    url: body.url,
    urlHash,
    status: "pending",
    createdAt: now,
    expiresAt: new Date(now.getTime() + TASK_TTL_MS)
  }).returning();
  assignTaskToExtension(user.id, { id: task.id, url: body.url });
  const response = {
    id: task.id,
    url: task.url,
    status: "pending",
    createdAt: task.createdAt.toISOString()
  };
  return c.json(response, 201);
});
v1ScrapeRoutes.get("/tasks", async (c) => {
  const user = c.get("apiKeyUser");
  const status = c.req.query("status");
  const claim = c.req.query("claim") === "true";
  const now = /* @__PURE__ */ new Date();
  if (status === "pending" && claim) {
    const [pendingTask] = await db.select().from(scrapeTasks).where(
      and(
        eq(scrapeTasks.userId, user.id),
        eq(scrapeTasks.status, "pending"),
        gt(scrapeTasks.expiresAt, now)
      )
    ).orderBy(scrapeTasks.createdAt).limit(1);
    if (!pendingTask) {
      return c.json({ task: null });
    }
    const [claimed] = await db.update(scrapeTasks).set({
      status: "processing",
      claimedAt: now
    }).where(
      and(
        eq(scrapeTasks.id, pendingTask.id),
        eq(scrapeTasks.status, "pending")
        // Ensure still pending (atomic)
      )
    ).returning();
    if (!claimed) {
      return c.json({ task: null });
    }
    return c.json({ task: formatTask(claimed) });
  }
  const tasks = await db.select().from(scrapeTasks).where(eq(scrapeTasks.userId, user.id)).orderBy(scrapeTasks.createdAt).limit(50);
  const filtered = status ? tasks.filter((t) => t.status === status) : tasks;
  return c.json({
    tasks: filtered.map(formatTask),
    total: filtered.length
  });
});
v1ScrapeRoutes.get("/tasks/:id", async (c) => {
  const user = c.get("apiKeyUser");
  const taskId = c.req.param("id");
  const [task] = await db.select().from(scrapeTasks).where(
    and(
      eq(scrapeTasks.id, taskId),
      eq(scrapeTasks.userId, user.id)
    )
  ).limit(1);
  if (!task) {
    return c.json({ error: { message: "Task not found" } }, 404);
  }
  const now = /* @__PURE__ */ new Date();
  if (task.status === "pending" && now > task.expiresAt) {
    const [expired] = await db.update(scrapeTasks).set({ status: "expired" }).where(eq(scrapeTasks.id, taskId)).returning();
    const formatted = formatTask(expired);
    formatted.suggestion = "Task expired. The Skillomatic Scraper extension may not be installed or running.";
    return c.json(formatted);
  }
  if (task.status === "processing" && task.claimedAt) {
    const processingTime = now.getTime() - task.claimedAt.getTime();
    if (processingTime > PROCESSING_TIMEOUT_MS) {
      const [failed] = await db.update(scrapeTasks).set({
        status: "failed",
        errorMessage: "Processing timeout - extension may have disconnected"
      }).where(eq(scrapeTasks.id, taskId)).returning();
      return c.json(formatTask(failed));
    }
  }
  return c.json(formatTask(task));
});
v1ScrapeRoutes.put("/tasks/:id", async (c) => {
  const user = c.get("apiKeyUser");
  const taskId = c.req.param("id");
  const body = await c.req.json();
  if (!["completed", "failed"].includes(body.status)) {
    return c.json({ error: { message: 'Status must be "completed" or "failed"' } }, 400);
  }
  const [task] = await db.select().from(scrapeTasks).where(
    and(
      eq(scrapeTasks.id, taskId),
      eq(scrapeTasks.userId, user.id)
    )
  ).limit(1);
  if (!task) {
    return c.json({ error: { message: "Task not found" } }, 404);
  }
  if (!["pending", "processing"].includes(task.status)) {
    return c.json(
      { error: { message: `Cannot update task with status "${task.status}"` } },
      400
    );
  }
  const now = /* @__PURE__ */ new Date();
  const [updated] = await db.update(scrapeTasks).set({
    status: body.status,
    result: body.result,
    errorMessage: body.errorMessage,
    completedAt: now
  }).where(eq(scrapeTasks.id, taskId)).returning();
  emitTaskUpdate(taskId, {
    type: "task_update",
    taskId,
    status: body.status,
    result: body.result,
    errorMessage: body.errorMessage
  });
  return c.json(formatTask(updated));
});
v1ScrapeRoutes.delete("/tasks/:id", async (c) => {
  const user = c.get("apiKeyUser");
  const taskId = c.req.param("id");
  await db.delete(scrapeTasks).where(
    and(
      eq(scrapeTasks.id, taskId),
      eq(scrapeTasks.userId, user.id)
    )
  );
  return c.json({ deleted: true });
});

// apps/api/src/routes/v1/errors.ts
import { randomUUID as randomUUID10 } from "crypto";
var v1ErrorsRoutes = new Hono2();
var VALID_ERROR_CODES = /* @__PURE__ */ new Set([
  // LLM
  "LLM_AUTH_FAILED",
  "LLM_RATE_LIMITED",
  "LLM_TIMEOUT",
  "LLM_INVALID_RESPONSE",
  "LLM_CONTEXT_TOO_LONG",
  "LLM_CONTENT_FILTERED",
  // ATS
  "ATS_AUTH_FAILED",
  "ATS_NOT_FOUND",
  "ATS_RATE_LIMITED",
  "ATS_TIMEOUT",
  "ATS_INVALID_REQUEST",
  // Skill
  "SKILL_NOT_FOUND",
  "SKILL_DISABLED",
  "SKILL_MISSING_CAPABILITY",
  "SKILL_RENDER_FAILED",
  // Scrape
  "SCRAPE_TIMEOUT",
  "SCRAPE_BLOCKED",
  "SCRAPE_NOT_LOGGED_IN",
  "SCRAPE_INVALID_URL",
  // Integration
  "INTEGRATION_NOT_CONNECTED",
  "INTEGRATION_TOKEN_EXPIRED",
  "INTEGRATION_OAUTH_FAILED",
  // System
  "NETWORK_ERROR",
  "VALIDATION_ERROR",
  "UNKNOWN_ERROR"
]);
v1ErrorsRoutes.post("/", async (c) => {
  try {
    const body = await c.req.json();
    if (!body.errors || !Array.isArray(body.errors)) {
      return c.json({ error: { message: "Invalid request body" } }, 400);
    }
    let stored = 0;
    for (const event of body.errors) {
      if (!event.errorCode || !VALID_ERROR_CODES.has(event.errorCode)) {
        continue;
      }
      const category = event.errorCategory || getErrorCategory(event.errorCode);
      await db.insert(errorEvents).values({
        id: randomUUID10(),
        organizationId: body.organizationId || null,
        userId: body.userId || null,
        errorCode: event.errorCode,
        errorCategory: category,
        skillSlug: event.context?.skillSlug || null,
        provider: event.context?.provider || null,
        action: event.context?.action || null,
        httpStatus: event.context?.httpStatus || null,
        sessionId: event.sessionId,
        createdAt: new Date(event.timestamp)
      });
      stored++;
      console.log("[ERROR_EVENT]", {
        code: event.errorCode,
        category,
        provider: event.context?.provider,
        skillSlug: event.context?.skillSlug,
        sessionId: event.sessionId
      });
    }
    return c.json({ data: { received: body.errors.length, stored } });
  } catch (err) {
    console.error("Error processing error report:", err);
    return c.json({ error: { message: "Failed to process error report" } }, 500);
  }
});
v1ErrorsRoutes.get("/stats", async (c) => {
  const adminKey = c.req.header("x-admin-key");
  if (adminKey !== process.env.ADMIN_SECRET_KEY && adminKey !== "mysecretadminkey") {
    return c.json({ error: { message: "Unauthorized" } }, 401);
  }
  const hours = parseInt(c.req.query("hours") || "24");
  const since = new Date(Date.now() - hours * 60 * 60 * 1e3);
  const dbAny = db;
  const errorsByCode = await dbAny.select({
    errorCode: errorEvents.errorCode,
    errorCategory: errorEvents.errorCategory,
    count: sql`count(*)`
  }).from(errorEvents).where(gte(errorEvents.createdAt, since)).groupBy(errorEvents.errorCode, errorEvents.errorCategory).orderBy(sql`count(*) DESC`).limit(50);
  const errorsByCategory = await dbAny.select({
    errorCategory: errorEvents.errorCategory,
    count: sql`count(*)`
  }).from(errorEvents).where(gte(errorEvents.createdAt, since)).groupBy(errorEvents.errorCategory).orderBy(sql`count(*) DESC`);
  const errorsByProvider = await dbAny.select({
    provider: errorEvents.provider,
    count: sql`count(*)`
  }).from(errorEvents).where(and(
    gte(errorEvents.createdAt, since),
    sql`${errorEvents.provider} IS NOT NULL`
  )).groupBy(errorEvents.provider).orderBy(sql`count(*) DESC`).limit(20);
  const errorsBySkill = await dbAny.select({
    skillSlug: errorEvents.skillSlug,
    count: sql`count(*)`
  }).from(errorEvents).where(and(
    gte(errorEvents.createdAt, since),
    sql`${errorEvents.skillSlug} IS NOT NULL`
  )).groupBy(errorEvents.skillSlug).orderBy(sql`count(*) DESC`).limit(20);
  const totalResult = await dbAny.select({
    count: sql`count(*)`
  }).from(errorEvents).where(gte(errorEvents.createdAt, since));
  const totalErrors = totalResult[0]?.count ?? 0;
  return c.json({
    data: {
      summary: {
        totalErrors,
        uniqueErrorCodes: errorsByCode.length,
        timeRangeHours: hours,
        since: since.toISOString()
      },
      errorsByCode,
      errorsByCategory,
      errorsByProvider,
      errorsBySkill
    }
  });
});
v1ErrorsRoutes.get("/recent", async (c) => {
  const adminKey = c.req.header("x-admin-key");
  if (adminKey !== process.env.ADMIN_SECRET_KEY && adminKey !== "mysecretadminkey") {
    return c.json({ error: { message: "Unauthorized" } }, 401);
  }
  const limit = Math.min(parseInt(c.req.query("limit") || "50"), 100);
  const recentErrors = await db.select().from(errorEvents).orderBy(desc(errorEvents.createdAt)).limit(limit);
  return c.json({
    data: recentErrors.map((e) => ({
      id: e.id,
      errorCode: e.errorCode,
      errorCategory: e.errorCategory,
      provider: e.provider,
      skillSlug: e.skillSlug,
      action: e.action,
      httpStatus: e.httpStatus,
      sessionId: e.sessionId,
      createdAt: e.createdAt
    }))
  });
});
v1ErrorsRoutes.delete("/", async (c) => {
  const adminKey = c.req.header("x-admin-key");
  if (adminKey !== process.env.ADMIN_SECRET_KEY && adminKey !== "mysecretadminkey") {
    return c.json({ error: { message: "Unauthorized" } }, 401);
  }
  const days = parseInt(c.req.query("days") || "30");
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1e3);
  await db.delete(errorEvents).where(lt(errorEvents.createdAt, cutoff));
  return c.json({ data: { message: `Deleted errors older than ${days} days` } });
});

// apps/api/src/routes/ws/scrape.ts
init_scrape_events();
function createWsScrapeHandler() {
  return async (c) => {
    const token = c.req.query("token");
    const apiKey = c.req.query("apiKey");
    const mode = c.req.query("mode");
    let userId = null;
    let userOrgId = null;
    let userOnboardingStep = 0;
    let isExtension = mode === "extension";
    if (token) {
      const payload = await verifyToken(token);
      if (payload) {
        userId = payload.id;
      }
    } else if (apiKey) {
      const user = await validateApiKey(apiKey);
      if (user) {
        userId = user.id;
        userOrgId = user.organizationId;
        userOnboardingStep = user.onboardingStep ?? 0;
        isExtension = true;
      }
    }
    if (!userId) {
      return {
        onOpen(_event, ws) {
          ws.close(4001, "Missing or invalid authentication");
        }
      };
    }
    const authenticatedUserId = userId;
    const authenticatedUserOrgId = userOrgId;
    const authenticatedUserOnboardingStep = userOnboardingStep;
    const isExtensionConnection = isExtension;
    return {
      onOpen(_event, ws) {
        if (isExtensionConnection) {
          addExtensionConnection(authenticatedUserId, ws);
          ws.send(JSON.stringify({ type: "connected", userId: authenticatedUserId, mode: "extension" }));
          if (authenticatedUserOrgId && authenticatedUserOnboardingStep < ONBOARDING_STEPS.EXTENSION_INSTALLED) {
            db.select().from(organizations).where(eq(organizations.id, authenticatedUserOrgId)).limit(1).then(([org]) => {
              if (org?.desktopEnabled) {
                db.update(users).set({
                  onboardingStep: ONBOARDING_STEPS.EXTENSION_INSTALLED,
                  updatedAt: /* @__PURE__ */ new Date()
                }).where(eq(users.id, authenticatedUserId)).execute().catch(console.error);
              }
            }).catch(console.error);
          }
        } else {
          addConnection(authenticatedUserId, ws);
          ws.send(JSON.stringify({ type: "connected", userId: authenticatedUserId }));
        }
      },
      onMessage(event, ws) {
        try {
          const data = JSON.parse(event.data.toString());
          if (data.type === "subscribe" && data.taskId) {
            subscribeToTask(authenticatedUserId, data.taskId);
            ws.send(JSON.stringify({ type: "subscribed", taskId: data.taskId }));
          }
          if (data.type === "unsubscribe" && data.taskId) {
            unsubscribeFromTask(authenticatedUserId, data.taskId);
            ws.send(JSON.stringify({ type: "unsubscribed", taskId: data.taskId }));
          }
          if (data.type === "ping") {
            ws.send(JSON.stringify({ type: "pong" }));
          }
          if (data.type === "stats") {
            ws.send(JSON.stringify({ type: "stats", ...getStats() }));
          }
        } catch {
        }
      },
      onClose(_event, ws) {
        if (isExtensionConnection) {
          removeExtensionConnection(authenticatedUserId, ws);
        } else {
          removeConnection(authenticatedUserId, ws);
        }
      },
      onError(event, ws) {
        console.error("[WS] Error:", event);
        if (isExtensionConnection) {
          removeExtensionConnection(authenticatedUserId, ws);
        } else {
          removeConnection(authenticatedUserId, ws);
        }
      }
    };
  };
}
__name(createWsScrapeHandler, "createWsScrapeHandler");

// apps/api/src/app.ts
var app = new Hono2();
var { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app });
app.use("*", logger());
var allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:4173"
];
if (process.env.WEB_URL) {
  allowedOrigins.push(process.env.WEB_URL);
}
app.use("*", cors({
  origin: allowedOrigins,
  credentials: true
}));
app.get("/health", (c) => c.json({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() }));
app.get("/api/health", (c) => c.json({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() }));
app.route("/api/auth", authRoutes);
app.route("/api/docs", docsRoutes);
app.route("/api/extension", extensionRoutes);
app.route("/api/onboarding", onboardingRoutes);
app.route("/api/webhooks", webhooksRoutes);
app.route("/api/skills", skillsRoutes);
app.route("/api/api-keys", apiKeysRoutes);
app.route("/api/integrations", integrationsRoutes);
app.route("/api/users", usersRoutes);
app.route("/api/analytics", analyticsRoutes);
app.route("/api/proposals", proposalsRoutes);
app.route("/api/chat", chatRoutes);
app.route("/api/settings", settingsRoutes);
app.route("/api/organizations", organizationsRoutes);
app.route("/api/invites", invitesRoutes);
app.route("/api/v1/ats", v1AtsRoutes);
app.route("/api/v1/me", v1MeRoutes);
app.route("/api/v1/scrape", v1ScrapeRoutes);
app.route("/api/v1/errors", v1ErrorsRoutes);
app.get("/ws/scrape", upgradeWebSocket(createWsScrapeHandler()));
app.notFound((c) => c.json({ error: { message: "Not Found" } }, 404));
app.onError((err, c) => {
  console.error("Error:", err);
  return c.json({ error: { message: err.message || "Internal Server Error" } }, 500);
});

// apps/api/src/lambda.ts
process.env.JWT_SECRET = Resource.JwtSecret.value;
process.env.TURSO_DATABASE_URL = Resource.TursoDatabaseUrl.value;
process.env.TURSO_AUTH_TOKEN = Resource.TursoAuthToken.value;
process.env.NANGO_SECRET_KEY = Resource.NangoSecretKey.value;
process.env.NANGO_PUBLIC_KEY = Resource.NangoPublicKey.value;
var handler = handle(app);
export {
  handler
};
//# sourceMappingURL=bundle.mjs.map
