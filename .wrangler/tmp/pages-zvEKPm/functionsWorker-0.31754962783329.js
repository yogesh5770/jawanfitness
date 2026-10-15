var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// ../../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/_internal/utils.mjs
// @__NO_SIDE_EFFECTS__
function createNotImplementedError(name) {
  return new Error(`[unenv] ${name} is not implemented yet!`);
}
__name(createNotImplementedError, "createNotImplementedError");
// @__NO_SIDE_EFFECTS__
function notImplemented(name) {
  const fn = /* @__PURE__ */ __name(() => {
    throw /* @__PURE__ */ createNotImplementedError(name);
  }, "fn");
  return Object.assign(fn, { __unenv__: true });
}
__name(notImplemented, "notImplemented");
// @__NO_SIDE_EFFECTS__
function notImplementedClass(name) {
  return class {
    __unenv__ = true;
    constructor() {
      throw new Error(`[unenv] ${name} is not implemented yet!`);
    }
  };
}
__name(notImplementedClass, "notImplementedClass");

// ../../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/internal/perf_hooks/performance.mjs
var _timeOrigin = globalThis.performance?.timeOrigin ?? Date.now();
var _performanceNow = globalThis.performance?.now ? globalThis.performance.now.bind(globalThis.performance) : () => Date.now() - _timeOrigin;
var nodeTiming = {
  name: "node",
  entryType: "node",
  startTime: 0,
  duration: 0,
  nodeStart: 0,
  v8Start: 0,
  bootstrapComplete: 0,
  environment: 0,
  loopStart: 0,
  loopExit: 0,
  idleTime: 0,
  uvMetricsInfo: {
    loopCount: 0,
    events: 0,
    eventsWaiting: 0
  },
  detail: void 0,
  toJSON() {
    return this;
  }
};
var PerformanceEntry = class {
  static {
    __name(this, "PerformanceEntry");
  }
  __unenv__ = true;
  detail;
  entryType = "event";
  name;
  startTime;
  constructor(name, options) {
    this.name = name;
    this.startTime = options?.startTime || _performanceNow();
    this.detail = options?.detail;
  }
  get duration() {
    return _performanceNow() - this.startTime;
  }
  toJSON() {
    return {
      name: this.name,
      entryType: this.entryType,
      startTime: this.startTime,
      duration: this.duration,
      detail: this.detail
    };
  }
};
var PerformanceMark = class PerformanceMark2 extends PerformanceEntry {
  static {
    __name(this, "PerformanceMark");
  }
  entryType = "mark";
  constructor() {
    super(...arguments);
  }
  get duration() {
    return 0;
  }
};
var PerformanceMeasure = class extends PerformanceEntry {
  static {
    __name(this, "PerformanceMeasure");
  }
  entryType = "measure";
};
var PerformanceResourceTiming = class extends PerformanceEntry {
  static {
    __name(this, "PerformanceResourceTiming");
  }
  entryType = "resource";
  serverTiming = [];
  connectEnd = 0;
  connectStart = 0;
  decodedBodySize = 0;
  domainLookupEnd = 0;
  domainLookupStart = 0;
  encodedBodySize = 0;
  fetchStart = 0;
  initiatorType = "";
  name = "";
  nextHopProtocol = "";
  redirectEnd = 0;
  redirectStart = 0;
  requestStart = 0;
  responseEnd = 0;
  responseStart = 0;
  secureConnectionStart = 0;
  startTime = 0;
  transferSize = 0;
  workerStart = 0;
  responseStatus = 0;
};
var PerformanceObserverEntryList = class {
  static {
    __name(this, "PerformanceObserverEntryList");
  }
  __unenv__ = true;
  getEntries() {
    return [];
  }
  getEntriesByName(_name, _type) {
    return [];
  }
  getEntriesByType(type) {
    return [];
  }
};
var Performance = class {
  static {
    __name(this, "Performance");
  }
  __unenv__ = true;
  timeOrigin = _timeOrigin;
  eventCounts = /* @__PURE__ */ new Map();
  _entries = [];
  _resourceTimingBufferSize = 0;
  navigation = void 0;
  timing = void 0;
  timerify(_fn, _options) {
    throw createNotImplementedError("Performance.timerify");
  }
  get nodeTiming() {
    return nodeTiming;
  }
  eventLoopUtilization() {
    return {};
  }
  markResourceTiming() {
    return new PerformanceResourceTiming("");
  }
  onresourcetimingbufferfull = null;
  now() {
    if (this.timeOrigin === _timeOrigin) {
      return _performanceNow();
    }
    return Date.now() - this.timeOrigin;
  }
  clearMarks(markName) {
    this._entries = markName ? this._entries.filter((e) => e.name !== markName) : this._entries.filter((e) => e.entryType !== "mark");
  }
  clearMeasures(measureName) {
    this._entries = measureName ? this._entries.filter((e) => e.name !== measureName) : this._entries.filter((e) => e.entryType !== "measure");
  }
  clearResourceTimings() {
    this._entries = this._entries.filter((e) => e.entryType !== "resource" || e.entryType !== "navigation");
  }
  getEntries() {
    return this._entries;
  }
  getEntriesByName(name, type) {
    return this._entries.filter((e) => e.name === name && (!type || e.entryType === type));
  }
  getEntriesByType(type) {
    return this._entries.filter((e) => e.entryType === type);
  }
  mark(name, options) {
    const entry = new PerformanceMark(name, options);
    this._entries.push(entry);
    return entry;
  }
  measure(measureName, startOrMeasureOptions, endMark) {
    let start;
    let end;
    if (typeof startOrMeasureOptions === "string") {
      start = this.getEntriesByName(startOrMeasureOptions, "mark")[0]?.startTime;
      end = this.getEntriesByName(endMark, "mark")[0]?.startTime;
    } else {
      start = Number.parseFloat(startOrMeasureOptions?.start) || this.now();
      end = Number.parseFloat(startOrMeasureOptions?.end) || this.now();
    }
    const entry = new PerformanceMeasure(measureName, {
      startTime: start,
      detail: {
        start,
        end
      }
    });
    this._entries.push(entry);
    return entry;
  }
  setResourceTimingBufferSize(maxSize) {
    this._resourceTimingBufferSize = maxSize;
  }
  addEventListener(type, listener, options) {
    throw createNotImplementedError("Performance.addEventListener");
  }
  removeEventListener(type, listener, options) {
    throw createNotImplementedError("Performance.removeEventListener");
  }
  dispatchEvent(event) {
    throw createNotImplementedError("Performance.dispatchEvent");
  }
  toJSON() {
    return this;
  }
};
var PerformanceObserver = class {
  static {
    __name(this, "PerformanceObserver");
  }
  __unenv__ = true;
  static supportedEntryTypes = [];
  _callback = null;
  constructor(callback) {
    this._callback = callback;
  }
  takeRecords() {
    return [];
  }
  disconnect() {
    throw createNotImplementedError("PerformanceObserver.disconnect");
  }
  observe(options) {
    throw createNotImplementedError("PerformanceObserver.observe");
  }
  bind(fn) {
    return fn;
  }
  runInAsyncScope(fn, thisArg, ...args) {
    return fn.call(thisArg, ...args);
  }
  asyncId() {
    return 0;
  }
  triggerAsyncId() {
    return 0;
  }
  emitDestroy() {
    return this;
  }
};
var performance = globalThis.performance && "addEventListener" in globalThis.performance ? globalThis.performance : new Performance();

// ../../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/@cloudflare/unenv-preset/dist/runtime/polyfill/performance.mjs
if (!("__unenv__" in performance)) {
  const proto = Performance.prototype;
  for (const key of Object.getOwnPropertyNames(proto)) {
    if (key !== "constructor" && !(key in performance)) {
      const desc = Object.getOwnPropertyDescriptor(proto, key);
      if (desc) {
        Object.defineProperty(performance, key, desc);
      }
    }
  }
}
globalThis.performance = performance;
globalThis.Performance = Performance;
globalThis.PerformanceEntry = PerformanceEntry;
globalThis.PerformanceMark = PerformanceMark;
globalThis.PerformanceMeasure = PerformanceMeasure;
globalThis.PerformanceObserver = PerformanceObserver;
globalThis.PerformanceObserverEntryList = PerformanceObserverEntryList;
globalThis.PerformanceResourceTiming = PerformanceResourceTiming;

// ../../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/console.mjs
import { Writable } from "node:stream";

// ../../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/mock/noop.mjs
var noop_default = Object.assign(() => {
}, { __unenv__: true });

// ../../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/console.mjs
var _console = globalThis.console;
var _ignoreErrors = true;
var _stderr = new Writable();
var _stdout = new Writable();
var log = _console?.log ?? noop_default;
var info = _console?.info ?? log;
var trace = _console?.trace ?? info;
var debug = _console?.debug ?? log;
var table = _console?.table ?? log;
var error = _console?.error ?? log;
var warn = _console?.warn ?? error;
var createTask = _console?.createTask ?? /* @__PURE__ */ notImplemented("console.createTask");
var clear = _console?.clear ?? noop_default;
var count = _console?.count ?? noop_default;
var countReset = _console?.countReset ?? noop_default;
var dir = _console?.dir ?? noop_default;
var dirxml = _console?.dirxml ?? noop_default;
var group = _console?.group ?? noop_default;
var groupEnd = _console?.groupEnd ?? noop_default;
var groupCollapsed = _console?.groupCollapsed ?? noop_default;
var profile = _console?.profile ?? noop_default;
var profileEnd = _console?.profileEnd ?? noop_default;
var time = _console?.time ?? noop_default;
var timeEnd = _console?.timeEnd ?? noop_default;
var timeLog = _console?.timeLog ?? noop_default;
var timeStamp = _console?.timeStamp ?? noop_default;
var Console = _console?.Console ?? /* @__PURE__ */ notImplementedClass("console.Console");
var _times = /* @__PURE__ */ new Map();
var _stdoutErrorHandler = noop_default;
var _stderrErrorHandler = noop_default;

// ../../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/@cloudflare/unenv-preset/dist/runtime/node/console.mjs
var workerdConsole = globalThis["console"];
var {
  assert,
  clear: clear2,
  // @ts-expect-error undocumented public API
  context,
  count: count2,
  countReset: countReset2,
  // @ts-expect-error undocumented public API
  createTask: createTask2,
  debug: debug2,
  dir: dir2,
  dirxml: dirxml2,
  error: error2,
  group: group2,
  groupCollapsed: groupCollapsed2,
  groupEnd: groupEnd2,
  info: info2,
  log: log2,
  profile: profile2,
  profileEnd: profileEnd2,
  table: table2,
  time: time2,
  timeEnd: timeEnd2,
  timeLog: timeLog2,
  timeStamp: timeStamp2,
  trace: trace2,
  warn: warn2
} = workerdConsole;
Object.assign(workerdConsole, {
  Console,
  _ignoreErrors,
  _stderr,
  _stderrErrorHandler,
  _stdout,
  _stdoutErrorHandler,
  _times
});
var console_default = workerdConsole;

// ../../../../../AppData/Roaming/npm/node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-console
globalThis.console = console_default;

// ../../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/internal/process/hrtime.mjs
var hrtime = /* @__PURE__ */ Object.assign(/* @__PURE__ */ __name(function hrtime2(startTime) {
  const now = Date.now();
  const seconds = Math.trunc(now / 1e3);
  const nanos = now % 1e3 * 1e6;
  if (startTime) {
    let diffSeconds = seconds - startTime[0];
    let diffNanos = nanos - startTime[0];
    if (diffNanos < 0) {
      diffSeconds = diffSeconds - 1;
      diffNanos = 1e9 + diffNanos;
    }
    return [diffSeconds, diffNanos];
  }
  return [seconds, nanos];
}, "hrtime"), { bigint: /* @__PURE__ */ __name(function bigint() {
  return BigInt(Date.now() * 1e6);
}, "bigint") });

// ../../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/internal/process/process.mjs
import { EventEmitter } from "node:events";

// ../../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/internal/tty/read-stream.mjs
var ReadStream = class {
  static {
    __name(this, "ReadStream");
  }
  fd;
  isRaw = false;
  isTTY = false;
  constructor(fd) {
    this.fd = fd;
  }
  setRawMode(mode) {
    this.isRaw = mode;
    return this;
  }
};

// ../../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/internal/tty/write-stream.mjs
var WriteStream = class {
  static {
    __name(this, "WriteStream");
  }
  fd;
  columns = 80;
  rows = 24;
  isTTY = false;
  constructor(fd) {
    this.fd = fd;
  }
  clearLine(dir3, callback) {
    callback && callback();
    return false;
  }
  clearScreenDown(callback) {
    callback && callback();
    return false;
  }
  cursorTo(x, y, callback) {
    callback && typeof callback === "function" && callback();
    return false;
  }
  moveCursor(dx, dy, callback) {
    callback && callback();
    return false;
  }
  getColorDepth(env2) {
    return 1;
  }
  hasColors(count3, env2) {
    return false;
  }
  getWindowSize() {
    return [this.columns, this.rows];
  }
  write(str, encoding, cb) {
    if (str instanceof Uint8Array) {
      str = new TextDecoder().decode(str);
    }
    try {
      console.log(str);
    } catch {
    }
    cb && typeof cb === "function" && cb();
    return false;
  }
};

// ../../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/internal/process/node-version.mjs
var NODE_VERSION = "22.14.0";

// ../../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/internal/process/process.mjs
var Process = class _Process extends EventEmitter {
  static {
    __name(this, "Process");
  }
  env;
  hrtime;
  nextTick;
  constructor(impl) {
    super();
    this.env = impl.env;
    this.hrtime = impl.hrtime;
    this.nextTick = impl.nextTick;
    for (const prop of [...Object.getOwnPropertyNames(_Process.prototype), ...Object.getOwnPropertyNames(EventEmitter.prototype)]) {
      const value = this[prop];
      if (typeof value === "function") {
        this[prop] = value.bind(this);
      }
    }
  }
  // --- event emitter ---
  emitWarning(warning, type, code) {
    console.warn(`${code ? `[${code}] ` : ""}${type ? `${type}: ` : ""}${warning}`);
  }
  emit(...args) {
    return super.emit(...args);
  }
  listeners(eventName) {
    return super.listeners(eventName);
  }
  // --- stdio (lazy initializers) ---
  #stdin;
  #stdout;
  #stderr;
  get stdin() {
    return this.#stdin ??= new ReadStream(0);
  }
  get stdout() {
    return this.#stdout ??= new WriteStream(1);
  }
  get stderr() {
    return this.#stderr ??= new WriteStream(2);
  }
  // --- cwd ---
  #cwd = "/";
  chdir(cwd2) {
    this.#cwd = cwd2;
  }
  cwd() {
    return this.#cwd;
  }
  // --- dummy props and getters ---
  arch = "";
  platform = "";
  argv = [];
  argv0 = "";
  execArgv = [];
  execPath = "";
  title = "";
  pid = 200;
  ppid = 100;
  get version() {
    return `v${NODE_VERSION}`;
  }
  get versions() {
    return { node: NODE_VERSION };
  }
  get allowedNodeEnvironmentFlags() {
    return /* @__PURE__ */ new Set();
  }
  get sourceMapsEnabled() {
    return false;
  }
  get debugPort() {
    return 0;
  }
  get throwDeprecation() {
    return false;
  }
  get traceDeprecation() {
    return false;
  }
  get features() {
    return {};
  }
  get release() {
    return {};
  }
  get connected() {
    return false;
  }
  get config() {
    return {};
  }
  get moduleLoadList() {
    return [];
  }
  constrainedMemory() {
    return 0;
  }
  availableMemory() {
    return 0;
  }
  uptime() {
    return 0;
  }
  resourceUsage() {
    return {};
  }
  // --- noop methods ---
  ref() {
  }
  unref() {
  }
  // --- unimplemented methods ---
  umask() {
    throw createNotImplementedError("process.umask");
  }
  getBuiltinModule() {
    return void 0;
  }
  getActiveResourcesInfo() {
    throw createNotImplementedError("process.getActiveResourcesInfo");
  }
  exit() {
    throw createNotImplementedError("process.exit");
  }
  reallyExit() {
    throw createNotImplementedError("process.reallyExit");
  }
  kill() {
    throw createNotImplementedError("process.kill");
  }
  abort() {
    throw createNotImplementedError("process.abort");
  }
  dlopen() {
    throw createNotImplementedError("process.dlopen");
  }
  setSourceMapsEnabled() {
    throw createNotImplementedError("process.setSourceMapsEnabled");
  }
  loadEnvFile() {
    throw createNotImplementedError("process.loadEnvFile");
  }
  disconnect() {
    throw createNotImplementedError("process.disconnect");
  }
  cpuUsage() {
    throw createNotImplementedError("process.cpuUsage");
  }
  setUncaughtExceptionCaptureCallback() {
    throw createNotImplementedError("process.setUncaughtExceptionCaptureCallback");
  }
  hasUncaughtExceptionCaptureCallback() {
    throw createNotImplementedError("process.hasUncaughtExceptionCaptureCallback");
  }
  initgroups() {
    throw createNotImplementedError("process.initgroups");
  }
  openStdin() {
    throw createNotImplementedError("process.openStdin");
  }
  assert() {
    throw createNotImplementedError("process.assert");
  }
  binding() {
    throw createNotImplementedError("process.binding");
  }
  // --- attached interfaces ---
  permission = { has: /* @__PURE__ */ notImplemented("process.permission.has") };
  report = {
    directory: "",
    filename: "",
    signal: "SIGUSR2",
    compact: false,
    reportOnFatalError: false,
    reportOnSignal: false,
    reportOnUncaughtException: false,
    getReport: /* @__PURE__ */ notImplemented("process.report.getReport"),
    writeReport: /* @__PURE__ */ notImplemented("process.report.writeReport")
  };
  finalization = {
    register: /* @__PURE__ */ notImplemented("process.finalization.register"),
    unregister: /* @__PURE__ */ notImplemented("process.finalization.unregister"),
    registerBeforeExit: /* @__PURE__ */ notImplemented("process.finalization.registerBeforeExit")
  };
  memoryUsage = Object.assign(() => ({
    arrayBuffers: 0,
    rss: 0,
    external: 0,
    heapTotal: 0,
    heapUsed: 0
  }), { rss: /* @__PURE__ */ __name(() => 0, "rss") });
  // --- undefined props ---
  mainModule = void 0;
  domain = void 0;
  // optional
  send = void 0;
  exitCode = void 0;
  channel = void 0;
  getegid = void 0;
  geteuid = void 0;
  getgid = void 0;
  getgroups = void 0;
  getuid = void 0;
  setegid = void 0;
  seteuid = void 0;
  setgid = void 0;
  setgroups = void 0;
  setuid = void 0;
  // internals
  _events = void 0;
  _eventsCount = void 0;
  _exiting = void 0;
  _maxListeners = void 0;
  _debugEnd = void 0;
  _debugProcess = void 0;
  _fatalException = void 0;
  _getActiveHandles = void 0;
  _getActiveRequests = void 0;
  _kill = void 0;
  _preload_modules = void 0;
  _rawDebug = void 0;
  _startProfilerIdleNotifier = void 0;
  _stopProfilerIdleNotifier = void 0;
  _tickCallback = void 0;
  _disconnect = void 0;
  _handleQueue = void 0;
  _pendingMessage = void 0;
  _channel = void 0;
  _send = void 0;
  _linkedBinding = void 0;
};

// ../../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/@cloudflare/unenv-preset/dist/runtime/node/process.mjs
var globalProcess = globalThis["process"];
var getBuiltinModule = globalProcess.getBuiltinModule;
var workerdProcess = getBuiltinModule("node:process");
var unenvProcess = new Process({
  env: globalProcess.env,
  hrtime,
  // `nextTick` is available from workerd process v1
  nextTick: workerdProcess.nextTick
});
var { exit, features, platform } = workerdProcess;
var {
  _channel,
  _debugEnd,
  _debugProcess,
  _disconnect,
  _events,
  _eventsCount,
  _exiting,
  _fatalException,
  _getActiveHandles,
  _getActiveRequests,
  _handleQueue,
  _kill,
  _linkedBinding,
  _maxListeners,
  _pendingMessage,
  _preload_modules,
  _rawDebug,
  _send,
  _startProfilerIdleNotifier,
  _stopProfilerIdleNotifier,
  _tickCallback,
  abort,
  addListener,
  allowedNodeEnvironmentFlags,
  arch,
  argv,
  argv0,
  assert: assert2,
  availableMemory,
  binding,
  channel,
  chdir,
  config,
  connected,
  constrainedMemory,
  cpuUsage,
  cwd,
  debugPort,
  disconnect,
  dlopen,
  domain,
  emit,
  emitWarning,
  env,
  eventNames,
  execArgv,
  execPath,
  exitCode,
  finalization,
  getActiveResourcesInfo,
  getegid,
  geteuid,
  getgid,
  getgroups,
  getMaxListeners,
  getuid,
  hasUncaughtExceptionCaptureCallback,
  hrtime: hrtime3,
  initgroups,
  kill,
  listenerCount,
  listeners,
  loadEnvFile,
  mainModule,
  memoryUsage,
  moduleLoadList,
  nextTick,
  off,
  on,
  once,
  openStdin,
  permission,
  pid,
  ppid,
  prependListener,
  prependOnceListener,
  rawListeners,
  reallyExit,
  ref,
  release,
  removeAllListeners,
  removeListener,
  report,
  resourceUsage,
  send,
  setegid,
  seteuid,
  setgid,
  setgroups,
  setMaxListeners,
  setSourceMapsEnabled,
  setuid,
  setUncaughtExceptionCaptureCallback,
  sourceMapsEnabled,
  stderr,
  stdin,
  stdout,
  throwDeprecation,
  title,
  traceDeprecation,
  umask,
  unref,
  uptime,
  version,
  versions
} = unenvProcess;
var _process = {
  abort,
  addListener,
  allowedNodeEnvironmentFlags,
  hasUncaughtExceptionCaptureCallback,
  setUncaughtExceptionCaptureCallback,
  loadEnvFile,
  sourceMapsEnabled,
  arch,
  argv,
  argv0,
  chdir,
  config,
  connected,
  constrainedMemory,
  availableMemory,
  cpuUsage,
  cwd,
  debugPort,
  dlopen,
  disconnect,
  emit,
  emitWarning,
  env,
  eventNames,
  execArgv,
  execPath,
  exit,
  finalization,
  features,
  getBuiltinModule,
  getActiveResourcesInfo,
  getMaxListeners,
  hrtime: hrtime3,
  kill,
  listeners,
  listenerCount,
  memoryUsage,
  nextTick,
  on,
  off,
  once,
  pid,
  platform,
  ppid,
  prependListener,
  prependOnceListener,
  rawListeners,
  release,
  removeAllListeners,
  removeListener,
  report,
  resourceUsage,
  setMaxListeners,
  setSourceMapsEnabled,
  stderr,
  stdin,
  stdout,
  title,
  throwDeprecation,
  traceDeprecation,
  umask,
  uptime,
  version,
  versions,
  // @ts-expect-error old API
  domain,
  initgroups,
  moduleLoadList,
  reallyExit,
  openStdin,
  assert: assert2,
  binding,
  send,
  exitCode,
  channel,
  getegid,
  geteuid,
  getgid,
  getgroups,
  getuid,
  setegid,
  seteuid,
  setgid,
  setgroups,
  setuid,
  permission,
  mainModule,
  _events,
  _eventsCount,
  _exiting,
  _maxListeners,
  _debugEnd,
  _debugProcess,
  _fatalException,
  _getActiveHandles,
  _getActiveRequests,
  _kill,
  _preload_modules,
  _rawDebug,
  _startProfilerIdleNotifier,
  _stopProfilerIdleNotifier,
  _tickCallback,
  _disconnect,
  _handleQueue,
  _pendingMessage,
  _channel,
  _send,
  _linkedBinding
};
var process_default = _process;

// ../../../../../AppData/Roaming/npm/node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-process
globalThis.process = process_default;

// api/auth.ts
var ALLOWED_ORIGINS = /* @__PURE__ */ new Set([
  "https://jawan.fit",
  "https://www.jawan.fit",
  "https://admin.jawan.fit",
  "https://trainer.jawan.fit",
  "https://app.jawan.fit",
  "https://jawan-fitness-app.pages.dev",
  "capacitor://localhost",
  "http://localhost",
  "https://localhost"
]);
function isOriginAllowed(origin) {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.has(origin)) return true;
  if (/^https:\/\/[a-z0-9-]+\.jawan-fitness-app\.pages\.dev$/.test(origin)) return true;
  if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return true;
  return false;
}
__name(isOriginAllowed, "isOriginAllowed");
function corsHeaders(request) {
  const origin = request.headers.get("Origin");
  const allowed = isOriginAllowed(origin);
  const allowOrigin = allowed && origin ? origin : "null";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, Cache-Control, Pragma, Accept",
    ...allowed && allowOrigin !== "null" ? { "Access-Control-Allow-Credentials": "true" } : {},
    "Content-Type": "application/json"
  };
}
__name(corsHeaders, "corsHeaders");
var DUMMY_SALT = "0123456789abcdef0123456789abcdef";
function constantTimeEqual(a, b) {
  if (a.length !== b.length) {
    let dummy = 0;
    for (let i = 0; i < a.length; i++) {
      dummy |= a.charCodeAt(i) ^ a.charCodeAt(i);
    }
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}
__name(constantTimeEqual, "constantTimeEqual");
var loginRateLimits = /* @__PURE__ */ new Map();
function checkRateLimit(key, maxAttempts) {
  const now = Date.now();
  const record = loginRateLimits.get(key);
  if (!record || now > record.resetAt) {
    return { allowed: true, retryAfterSeconds: 0 };
  }
  if (record.attempts >= maxAttempts) {
    return { allowed: false, retryAfterSeconds: Math.ceil((record.resetAt - now) / 1e3) };
  }
  return { allowed: true, retryAfterSeconds: 0 };
}
__name(checkRateLimit, "checkRateLimit");
function recordFailedAttempt(key, windowMs) {
  const now = Date.now();
  const record = loginRateLimits.get(key);
  if (!record || now > record.resetAt) {
    loginRateLimits.set(key, { attempts: 1, resetAt: now + windowMs });
  } else {
    record.attempts += 1;
  }
  if (loginRateLimits.size > 5e3) {
    for (const [k, v] of loginRateLimits.entries()) {
      if (now > v.resetAt) loginRateLimits.delete(k);
    }
  }
}
__name(recordFailedAttempt, "recordFailedAttempt");
function clearRateLimit(key) {
  loginRateLimits.delete(key);
}
__name(clearRateLimit, "clearRateLimit");
async function hashPassword(password, salt, iterations = 21e4) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );
  const derived = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: enc.encode(salt),
      iterations,
      hash: "SHA-512"
    },
    keyMaterial,
    512
  );
  const hashArray = Array.from(new Uint8Array(derived));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(hashPassword, "hashPassword");
function generateRandomHex(byteCount = 32) {
  const array = new Uint8Array(byteCount);
  crypto.getRandomValues(array);
  return Array.from(array).map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(generateRandomHex, "generateRandomHex");
function getBearerToken(request) {
  const auth = request.headers.get("Authorization");
  if (!auth || !auth.startsWith("Bearer ")) return null;
  return auth.substring(7).trim();
}
__name(getBearerToken, "getBearerToken");
var onRequestOptions = /* @__PURE__ */ __name(async ({ request }) => {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(request)
  });
}, "onRequestOptions");
var onRequest = /* @__PURE__ */ __name(async (context2) => {
  const { request, env: env2 } = context2;
  const url = new URL(request.url);
  const action = url.searchParams.get("action") || "login";
  const headers = corsHeaders(request);
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }
  try {
    if (action === "login" && request.method === "POST") {
      const body = await request.json();
      const { email, password, requiredRole = "ADMIN", keepSignedIn = true } = body || {};
      if (!email || !password) {
        return new Response(JSON.stringify({ error: "User ID / email and password are required." }), {
          status: 400,
          headers
        });
      }
      const cleanInput = email.trim();
      const digitsOnly = cleanInput.replace(/\D/g, "");
      const last10Digits = digitsOnly.length >= 10 ? digitsOnly.slice(-10) : digitsOnly;
      const phoneWithCountry = last10Digits ? `+91${last10Digits}` : cleanInput;
      const clientIp = request.headers.get("CF-Connecting-IP") || request.headers.get("X-Forwarded-For")?.split(",")[0].trim() || "127.0.0.1";
      const rateLimitKey = `${clientIp}:${cleanInput.toLowerCase()}`;
      const ipLimitKey = `ip:${clientIp}`;
      const compoundCheck = checkRateLimit(rateLimitKey, 5);
      const ipCheck = checkRateLimit(ipLimitKey, 25);
      if (!compoundCheck.allowed || !ipCheck.allowed) {
        const retryAfter = Math.max(compoundCheck.retryAfterSeconds, ipCheck.retryAfterSeconds, 1);
        return new Response(JSON.stringify({ error: "Too many failed login attempts. Please wait 15 minutes before trying again." }), {
          status: 429,
          headers: {
            ...headers,
            "Retry-After": String(retryAfter)
          }
        });
      }
      const user = await env2.DB.prepare(`
        SELECT * FROM gym_users
        WHERE (
          LOWER(email) = LOWER(?)
          OR LOWER(login_id) = LOWER(?)
          OR phone = ?
          OR phone = ?
          OR (length(?) >= 10 AND phone LIKE '%' || ?)
        )
        ORDER BY CASE 
          WHEN role = ? THEN 0 
          WHEN role = 'ADMIN' THEN 1
          ELSE 2 
        END
        LIMIT 1
      `).bind(
        cleanInput,
        cleanInput,
        cleanInput,
        phoneWithCountry,
        last10Digits,
        last10Digits,
        requiredRole
      ).first();
      if (!user) {
        await hashPassword(password, DUMMY_SALT, 21e4);
        recordFailedAttempt(rateLimitKey, 15 * 60 * 1e3);
        recordFailedAttempt(ipLimitKey, 15 * 60 * 1e3);
        return new Response(JSON.stringify({ error: "Invalid user credentials." }), {
          status: 401,
          headers
        });
      }
      const storedIterations = typeof user.iterations === "number" && user.iterations > 0 ? user.iterations : 1e5;
      const inputHash = await hashPassword(password, user.salt, storedIterations);
      if (!constantTimeEqual(inputHash, user.password_hash)) {
        recordFailedAttempt(rateLimitKey, 15 * 60 * 1e3);
        recordFailedAttempt(ipLimitKey, 15 * 60 * 1e3);
        return new Response(JSON.stringify({ error: "Invalid user credentials." }), {
          status: 401,
          headers
        });
      }
      clearRateLimit(rateLimitKey);
      if (storedIterations < 21e4) {
        try {
          const upgradedHash = await hashPassword(password, user.salt, 21e4);
          await env2.DB.prepare(`
            UPDATE gym_users
            SET password_hash = ?, iterations = 210000, updated_at = datetime('now')
            WHERE id = ?
          `).bind(upgradedHash, user.id).run();
        } catch {
        }
      }
      const roleHierarchy = { CLIENT: 1, TRAINER: 2, ADMIN: 3 };
      const userLevel = roleHierarchy[user.role] || 0;
      const requiredLevel = roleHierarchy[requiredRole] || 1;
      if (userLevel < requiredLevel) {
        return new Response(JSON.stringify({ error: `Access denied. Requires ${requiredRole} privileges.` }), {
          status: 403,
          headers
        });
      }
      const token = generateRandomHex(32);
      const days = keepSignedIn ? 365 : 30;
      const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1e3).toISOString();
      const sessionId = generateRandomHex(16);
      await env2.DB.prepare(`
        INSERT INTO gym_sessions (id, token, user_id, role, expires_at)
        VALUES (?, ?, ?, ?, ?)
      `).bind(sessionId, token, user.id, user.role, expiresAt).run();
      await env2.DB.prepare(`
        UPDATE gym_users SET last_login = datetime('now') WHERE id = ?
      `).bind(user.id).run();
      return new Response(JSON.stringify({
        token,
        expiresAt,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          name: user.name,
          phone: user.phone,
          login_id: user.login_id,
          loginId: user.login_id,
          startingWeightKg: user.starting_weight_kg ?? 0,
          currentWeightKg: user.current_weight_kg ?? user.starting_weight_kg ?? 0,
          goalWeightKg: user.goal_weight_kg ?? 0,
          heightCm: user.height_cm ?? 170,
          goal: user.goal ?? "General Fitness",
          trainerId: user.trainer_id ?? "",
          trainerName: user.trainer_name ?? "Unassigned"
        }
      }), {
        status: 200,
        headers
      });
    }
    if (action === "verify" && (request.method === "GET" || request.method === "POST")) {
      let token = getBearerToken(request);
      if (!token && request.method === "POST") {
        try {
          const body = await request.clone().json();
          token = body?.token || null;
        } catch {
        }
      }
      if (!token) {
        return new Response(JSON.stringify({ valid: false, error: "No token provided" }), {
          status: 401,
          headers
        });
      }
      const session = await env2.DB.prepare(`
        SELECT s.*, u.email, u.name, u.phone, u.login_id,
               u.starting_weight_kg, u.current_weight_kg, u.goal_weight_kg,
               u.height_cm, u.goal, u.trainer_id, u.trainer_name
        FROM gym_sessions s
        JOIN gym_users u ON s.user_id = u.id
        WHERE s.token = ? AND datetime(s.expires_at) > datetime('now')
        LIMIT 1
      `).bind(token).first();
      if (!session) {
        return new Response(JSON.stringify({ valid: false }), {
          status: 401,
          headers
        });
      }
      return new Response(JSON.stringify({
        valid: true,
        expiresAt: session.expires_at,
        user: {
          id: session.user_id,
          role: session.role,
          email: session.email,
          name: session.name,
          phone: session.phone,
          login_id: session.login_id,
          loginId: session.login_id,
          startingWeightKg: session.starting_weight_kg ?? 0,
          currentWeightKg: session.current_weight_kg ?? session.starting_weight_kg ?? 0,
          goalWeightKg: session.goal_weight_kg ?? 0,
          heightCm: session.height_cm ?? 170,
          goal: session.goal ?? "General Fitness",
          trainerId: session.trainer_id ?? "",
          trainerName: session.trainer_name ?? "Unassigned"
        }
      }), {
        status: 200,
        headers
      });
    }
    if (action === "change-password" && request.method === "POST") {
      const body = await request.json();
      const { email, identifier, oldPassword, newPassword } = body || {};
      const userIdentifier = email || identifier;
      if (!userIdentifier || !oldPassword || !newPassword) {
        return new Response(JSON.stringify({ error: "User ID, old password, and new password are required." }), {
          status: 400,
          headers
        });
      }
      if (newPassword.length < 6) {
        return new Response(JSON.stringify({ error: "New password must be at least 6 characters long." }), {
          status: 400,
          headers
        });
      }
      const cleanInput = userIdentifier.trim();
      const user = await env2.DB.prepare(`
        SELECT * FROM gym_users
        WHERE LOWER(email) = LOWER(?)
           OR LOWER(login_id) = LOWER(?)
           OR phone = ?
        LIMIT 1
      `).bind(cleanInput, cleanInput, cleanInput).first();
      if (!user) {
        return new Response(JSON.stringify({ error: "User not found." }), {
          status: 404,
          headers
        });
      }
      const storedIterations = typeof user.iterations === "number" && user.iterations > 0 ? user.iterations : 1e5;
      const oldHash = await hashPassword(oldPassword, user.salt, storedIterations);
      if (!constantTimeEqual(oldHash, user.password_hash)) {
        return new Response(JSON.stringify({ error: "Current password does not match." }), {
          status: 401,
          headers
        });
      }
      const newSalt = generateRandomHex(16);
      const newHash = await hashPassword(newPassword, newSalt, 21e4);
      try {
        await env2.DB.prepare(`
          UPDATE gym_users
          SET password_hash = ?, salt = ?, iterations = 210000, updated_at = datetime('now')
          WHERE id = ?
        `).bind(newHash, newSalt, user.id).run();
      } catch {
        await env2.DB.prepare(`
          UPDATE gym_users
          SET password_hash = ?, salt = ?, updated_at = datetime('now')
          WHERE id = ?
        `).bind(newHash, newSalt, user.id).run();
      }
      return new Response(JSON.stringify({ success: true, message: "Password updated successfully!" }), {
        status: 200,
        headers
      });
    }
    if ((action === "register" || action === "create-user") && request.method === "POST") {
      const token = getBearerToken(request);
      const adminSession = token ? await env2.DB.prepare(`
        SELECT * FROM gym_sessions
        WHERE token = ? AND role = 'ADMIN' AND datetime(expires_at) > datetime('now')
        LIMIT 1
      `).bind(token).first() : null;
      if (!adminSession) {
        return new Response(JSON.stringify({ error: "Admin privileges required to register users." }), {
          status: 403,
          headers
        });
      }
      const body = await request.json();
      const {
        id,
        email,
        password,
        role,
        name,
        phone,
        login_id,
        loginId,
        startingWeightKg,
        starting_weight_kg,
        currentWeightKg,
        current_weight_kg,
        goalWeightKg,
        goal_weight_kg,
        heightCm,
        height_cm,
        goal,
        trainerId,
        trainer_id,
        trainerName,
        trainer_name
      } = body || {};
      const userLoginId = login_id || loginId || null;
      const finalStartWeight = startingWeightKg ?? starting_weight_kg ?? 0;
      const finalCurrentWeight = currentWeightKg ?? current_weight_kg ?? finalStartWeight;
      const finalGoalWeight = goalWeightKg ?? goal_weight_kg ?? 0;
      const finalHeight = heightCm ?? height_cm ?? 170;
      const finalGoal = goal || "General Fitness";
      const finalTrainerId = trainerId || trainer_id || "";
      const finalTrainerName = trainerName || trainer_name || "Unassigned";
      if (!email || !password || !role || !name) {
        return new Response(JSON.stringify({ error: "Email, password, role, and name are required." }), {
          status: 400,
          headers
        });
      }
      const salt = generateRandomHex(16);
      const passwordHash = await hashPassword(password, salt, 21e4);
      const userId = id || generateRandomHex(16);
      try {
        await env2.DB.prepare(`
          INSERT INTO gym_users (
            id, email, password_hash, salt, role, name, phone, login_id,
            starting_weight_kg, current_weight_kg, goal_weight_kg,
            height_cm, goal, trainer_id, trainer_name, iterations
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 210000)
          ON CONFLICT(id) DO UPDATE SET
            email = excluded.email,
            password_hash = excluded.password_hash,
            salt = excluded.salt,
            role = excluded.role,
            name = excluded.name,
            phone = excluded.phone,
            login_id = excluded.login_id,
            starting_weight_kg = excluded.starting_weight_kg,
            current_weight_kg = excluded.current_weight_kg,
            goal_weight_kg = excluded.goal_weight_kg,
            height_cm = excluded.height_cm,
            goal = excluded.goal,
            trainer_id = excluded.trainer_id,
            trainer_name = excluded.trainer_name,
            iterations = 210000,
            updated_at = datetime('now');
        `).bind(
          userId,
          email.toLowerCase().trim(),
          passwordHash,
          salt,
          role,
          name.trim(),
          phone || null,
          userLoginId,
          finalStartWeight,
          finalCurrentWeight,
          finalGoalWeight,
          finalHeight,
          finalGoal,
          finalTrainerId,
          finalTrainerName
        ).run();
      } catch {
        await env2.DB.prepare(`
          INSERT INTO gym_users (
            id, email, password_hash, salt, role, name, phone, login_id,
            starting_weight_kg, current_weight_kg, goal_weight_kg,
            height_cm, goal, trainer_id, trainer_name
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            email = excluded.email,
            password_hash = excluded.password_hash,
            salt = excluded.salt,
            role = excluded.role,
            name = excluded.name,
            phone = excluded.phone,
            login_id = excluded.login_id,
            starting_weight_kg = excluded.starting_weight_kg,
            current_weight_kg = excluded.current_weight_kg,
            goal_weight_kg = excluded.goal_weight_kg,
            height_cm = excluded.height_cm,
            goal = excluded.goal,
            trainer_id = excluded.trainer_id,
            trainer_name = excluded.trainer_name,
            updated_at = datetime('now');
        `).bind(
          userId,
          email.toLowerCase().trim(),
          passwordHash,
          salt,
          role,
          name.trim(),
          phone || null,
          userLoginId,
          finalStartWeight,
          finalCurrentWeight,
          finalGoalWeight,
          finalHeight,
          finalGoal,
          finalTrainerId,
          finalTrainerName
        ).run();
      }
      return new Response(JSON.stringify({
        success: true,
        user: {
          id: userId,
          email,
          role,
          name,
          phone,
          loginId: userLoginId,
          login_id: userLoginId,
          startingWeightKg: finalStartWeight,
          currentWeightKg: finalCurrentWeight,
          goalWeightKg: finalGoalWeight,
          heightCm: finalHeight,
          goal: finalGoal,
          trainerId: finalTrainerId,
          trainerName: finalTrainerName
        }
      }), {
        status: 201,
        headers
      });
    }
    if (action === "logout") {
      const token = getBearerToken(request);
      if (token) {
        await env2.DB.prepare(`DELETE FROM gym_sessions WHERE token = ?`).bind(token).run();
      }
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers
      });
    }
    return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
      status: 400,
      headers
    });
  } catch (error3) {
    return new Response(JSON.stringify({ error: error3?.message || "Internal server error" }), {
      status: 500,
      headers
    });
  }
}, "onRequest");

// api/sync.ts
var ALLOWED_ORIGINS2 = /* @__PURE__ */ new Set([
  "https://jawan.fit",
  "https://www.jawan.fit",
  "https://admin.jawan.fit",
  "https://trainer.jawan.fit",
  "https://app.jawan.fit",
  "https://jawan-fitness-app.pages.dev",
  "capacitor://localhost",
  "http://localhost",
  "https://localhost"
]);
function isOriginAllowed2(origin) {
  if (!origin) return false;
  if (ALLOWED_ORIGINS2.has(origin)) return true;
  if (/^https:\/\/[a-z0-9-]+\.jawan-fitness-app\.pages\.dev$/.test(origin)) return true;
  if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return true;
  return false;
}
__name(isOriginAllowed2, "isOriginAllowed");
function corsHeaders2(request) {
  const origin = request.headers.get("Origin");
  const allowed = isOriginAllowed2(origin);
  const allowOrigin = allowed && origin ? origin : "null";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, Cache-Control, Pragma, Accept",
    ...allowed && allowOrigin !== "null" ? { "Access-Control-Allow-Credentials": "true" } : {},
    "Content-Type": "application/json"
  };
}
__name(corsHeaders2, "corsHeaders");
function getBearerToken2(request) {
  const auth = request.headers.get("Authorization");
  if (!auth || !auth.startsWith("Bearer ")) return null;
  return auth.substring(7).trim();
}
__name(getBearerToken2, "getBearerToken");
function stripSecrets(list) {
  if (!Array.isArray(list)) return [];
  return list.map((item) => {
    if (item && typeof item === "object" && "temporaryPassword" in item) {
      const { temporaryPassword: _removed, ...rest } = item;
      return rest;
    }
    return item;
  });
}
__name(stripSecrets, "stripSecrets");
function sameUser(record, session) {
  if (!record) return false;
  const uid = (session.user_id || "").toLowerCase();
  const email = (session.email || "").toLowerCase();
  const loginId = (session.login_id || "").toLowerCase();
  const phoneDigits = (session.phone || "").replace(/\D/g, "");
  if (record.id && uid && record.id.toLowerCase() === uid) return true;
  if (record.email && email && record.email.toLowerCase() === email) return true;
  if (record.loginId && loginId && record.loginId.toLowerCase() === loginId) return true;
  if (phoneDigits.length >= 10 && record.phone && record.phone.replace(/\D/g, "").endsWith(phoneDigits.slice(-10))) return true;
  return false;
}
__name(sameUser, "sameUser");
function identityKeys(session, ownBlobRecord) {
  const keys = /* @__PURE__ */ new Set();
  const add = /* @__PURE__ */ __name((v) => {
    if (v) {
      keys.add(String(v).toLowerCase());
    }
  }, "add");
  add(session.user_id);
  add(session.email);
  add(session.login_id);
  if (ownBlobRecord) {
    add(ownBlobRecord.id);
    add(ownBlobRecord.loginId);
    add(ownBlobRecord.email);
  }
  return keys;
}
__name(identityKeys, "identityKeys");
function keyMatches(key, keys) {
  return keys.has(String(key || "").toLowerCase());
}
__name(keyMatches, "keyMatches");
function scopeStateForRole(inner, session) {
  const role = session.role;
  inner.clients = stripSecrets(inner.clients);
  inner.trainers = stripSecrets(inner.trainers);
  if (role === "ADMIN") return inner;
  const clients = Array.isArray(inner.clients) ? inner.clients : [];
  const trainers = Array.isArray(inner.trainers) ? inner.trainers : [];
  if (role === "CLIENT") {
    const own = clients.find((c) => sameUser(c, session)) || null;
    const keys = identityKeys(session, own);
    const ownId = own?.id || session.user_id;
    const scopedTrainers = own?.trainerId ? trainers.filter((t) => t.id === own.trainerId || sameUser(t, session)) : trainers.filter((t) => sameUser(t, session));
    const scopedWorkouts = {};
    for (const [k, v] of Object.entries(inner.assignedWorkouts || {})) {
      if (keyMatches(k, keys)) scopedWorkouts[k] = v;
    }
    const scopedDiets = {};
    for (const [k, v] of Object.entries(inner.assignedDietPlans || {})) {
      if (keyMatches(k, keys)) scopedDiets[k] = v;
    }
    return {
      ...inner,
      clients: own ? [own] : [],
      trainers: scopedTrainers,
      assignedWorkouts: scopedWorkouts,
      assignedDietPlans: scopedDiets,
      workoutHistory: (inner.workoutHistory || []).filter((w) => !w?.clientId || w.clientId === ownId),
      loggedMeals: (inner.loggedMeals || []).filter((m) => !m?.clientId || m.clientId === ownId),
      weightHistory: (inner.weightHistory || []).filter((w) => !w?.clientId || w.clientId === ownId),
      messages: (inner.messages || []).filter((m) => m?.clientId === ownId),
      events: [],
      activeClientId: ownId
    };
  }
  if (role === "TRAINER") {
    const self = trainers.find((t) => sameUser(t, session)) || null;
    const keys = identityKeys(session, self);
    const trainerIds = /* @__PURE__ */ new Set();
    if (session.user_id) trainerIds.add(session.user_id);
    if (self?.id) trainerIds.add(self.id);
    const myClients = clients.filter((c) => c?.trainerId && trainerIds.has(c.trainerId));
    const myClientIds = new Set(myClients.map((c) => c.id).filter(Boolean));
    const myClientKeys = /* @__PURE__ */ new Set();
    for (const c of myClients) {
      if (c.id) myClientKeys.add(String(c.id).toLowerCase());
      if (c.loginId) myClientKeys.add(String(c.loginId).toLowerCase());
      if (c.email) myClientKeys.add(String(c.email).toLowerCase());
    }
    const scopedWorkouts = {};
    for (const [k, v] of Object.entries(inner.assignedWorkouts || {})) {
      if (keyMatches(k, myClientKeys) || keyMatches(k, keys)) scopedWorkouts[k] = v;
    }
    const scopedDiets = {};
    for (const [k, v] of Object.entries(inner.assignedDietPlans || {})) {
      if (keyMatches(k, myClientKeys) || keyMatches(k, keys)) scopedDiets[k] = v;
    }
    return {
      ...inner,
      clients: myClients,
      trainers: self ? [self] : trainers.filter((t) => sameUser(t, session)),
      assignedWorkouts: scopedWorkouts,
      assignedDietPlans: scopedDiets,
      workoutHistory: (inner.workoutHistory || []).filter((w) => w?.clientId && myClientIds.has(w.clientId)),
      loggedMeals: (inner.loggedMeals || []).filter((m) => m?.clientId && myClientIds.has(m.clientId)),
      weightHistory: (inner.weightHistory || []).filter((w) => w?.clientId && myClientIds.has(w.clientId)),
      messages: (inner.messages || []).filter(
        (m) => m?.trainerId && trainerIds.has(m.trainerId) || m?.clientId && myClientIds.has(m.clientId)
      ),
      events: []
    };
  }
  return inner;
}
__name(scopeStateForRole, "scopeStateForRole");
function mergeNonAdminPost(incoming, existingState, session) {
  const role = session.role;
  const clients = Array.isArray(existingState.clients) ? existingState.clients : [];
  const trainers = Array.isArray(existingState.trainers) ? existingState.trainers : [];
  if (role === "CLIENT") {
    const own = clients.find((c) => sameUser(c, session)) || null;
    const ownId = own?.id || session.user_id;
    const stamp = /* @__PURE__ */ __name((arr) => (Array.isArray(arr) ? arr : []).map((e) => e && !e.clientId ? { ...e, clientId: ownId } : e), "stamp");
    const ownRecord = Array.isArray(incoming.clients) ? incoming.clients.find((c) => sameUser(c, session)) : null;
    let mergedClients2 = clients;
    if (own && ownRecord) {
      mergedClients2 = clients.map(
        (c) => c.id === own.id ? {
          ...c,
          currentWeightKg: ownRecord.currentWeightKg ?? c.currentWeightKg,
          startingWeightKg: ownRecord.startingWeightKg ?? c.startingWeightKg,
          goalWeightKg: ownRecord.goalWeightKg ?? c.goalWeightKg,
          heightCm: ownRecord.heightCm ?? c.heightCm,
          goal: ownRecord.goal ?? c.goal,
          firstLoginCompleted: ownRecord.firstLoginCompleted ?? c.firstLoginCompleted
        } : c
      );
    }
    const msgMap = /* @__PURE__ */ new Map();
    for (const m of existingState.messages || []) if (m?.id) msgMap.set(m.id, m);
    for (const m of stamp(incoming.messages)) if (m?.id) msgMsgSet(msgMap, m, ownId);
    return {
      clients: mergedClients2,
      trainers,
      assignedWorkouts: existingState.assignedWorkouts || {},
      assignedDietPlans: existingState.assignedDietPlans || {},
      workoutHistory: unionById(existingState.workoutHistory, stamp(incoming.workoutHistory)),
      loggedMeals: unionById(existingState.loggedMeals, stamp(incoming.loggedMeals)),
      weightHistory: unionById(existingState.weightHistory, stamp(incoming.weightHistory)),
      events: existingState.events || [],
      messages: Array.from(msgMap.values()).sort((a, b) => Number(a.timestamp || 0) - Number(b.timestamp || 0)),
      customFoods: Array.isArray(incoming.customFoods) && incoming.customFoods.length > 0 ? unionById(existingState.customFoods, incoming.customFoods) : existingState.customFoods || []
    };
  }
  const self = trainers.find((t) => sameUser(t, session)) || null;
  const trainerIds = /* @__PURE__ */ new Set();
  if (session.user_id) trainerIds.add(session.user_id);
  if (self?.id) trainerIds.add(self.id);
  const myClients = clients.filter((c) => c?.trainerId && trainerIds.has(c.trainerId));
  const myClientIds = new Set(myClients.map((c) => c.id).filter(Boolean));
  const scopedWorkouts = { ...existingState.assignedWorkouts || {} };
  for (const [k, v] of Object.entries(incoming.assignedWorkouts || {})) {
    if (v && myClientIds.has(String(v.clientId || k))) scopedWorkouts[k] = v;
    else if (v && myClients.some((c) => [c.id, c.loginId, c.email].filter(Boolean).map(String).includes(String(k)))) {
      scopedWorkouts[k] = v;
    }
  }
  const scopedDiets = { ...existingState.assignedDietPlans || {} };
  for (const [k, v] of Object.entries(incoming.assignedDietPlans || {})) {
    if (v && myClients.some((c) => [c.id, c.loginId, c.email].filter(Boolean).map(String).includes(String(k)))) {
      scopedDiets[k] = v;
    }
  }
  const mergedClients = clients.map((c) => {
    if (!myClientIds.has(c.id)) return c;
    const ic = Array.isArray(incoming.clients) ? incoming.clients.find((x) => x.id === c.id) : null;
    if (!ic) return c;
    return {
      ...c,
      currentWeightKg: ic.currentWeightKg ?? c.currentWeightKg,
      workoutAdherence: ic.workoutAdherence ?? c.workoutAdherence,
      dietAdherence: ic.dietAdherence ?? c.dietAdherence,
      lastWorkout: ic.lastWorkout ?? c.lastWorkout,
      trainerId: c.trainerId,
      trainerName: c.trainerName
    };
  });
  const msgMap2 = /* @__PURE__ */ new Map();
  for (const m of existingState.messages || []) if (m?.id) msgMap2.set(m.id, m);
  for (const m of incoming.messages || []) {
    if (!m?.id) continue;
    const allowed = m.trainerId && trainerIds.has(m.trainerId) || m.clientId && myClientIds.has(m.clientId);
    if (allowed) msgMap2.set(m.id, m);
  }
  return {
    clients: mergedClients,
    trainers,
    assignedWorkouts: scopedWorkouts,
    assignedDietPlans: scopedDiets,
    workoutHistory: unionById(existingState.workoutHistory, (incoming.workoutHistory || []).filter((w) => w?.clientId && myClientIds.has(w.clientId))),
    loggedMeals: unionById(existingState.loggedMeals, (incoming.loggedMeals || []).filter((m) => m?.clientId && myClientIds.has(m.clientId))),
    weightHistory: unionById(existingState.weightHistory, (incoming.weightHistory || []).filter((w) => w?.clientId && myClientIds.has(w.clientId))),
    events: existingState.events || [],
    messages: Array.from(msgMap2.values()).sort((a, b) => Number(a.timestamp || 0) - Number(b.timestamp || 0)),
    customFoods: Array.isArray(incoming.customFoods) && incoming.customFoods.length > 0 ? unionById(existingState.customFoods, incoming.customFoods) : existingState.customFoods || []
  };
}
__name(mergeNonAdminPost, "mergeNonAdminPost");
function msgMsgSet(map, m, ownId) {
  if (m.clientId === ownId || !m.clientId) map.set(m.id, { ...m, clientId: m.clientId || ownId });
}
__name(msgMsgSet, "msgMsgSet");
function unionById(existing, incoming) {
  const map = /* @__PURE__ */ new Map();
  for (const e of existing || []) if (e?.id) map.set(e.id, e);
  for (const e of incoming || []) if (e?.id) map.set(e.id, e);
  return Array.from(map.values());
}
__name(unionById, "unionById");
var onRequestOptions2 = /* @__PURE__ */ __name(async ({ request }) => {
  return new Response(null, {
    status: 204,
    headers: corsHeaders2(request)
  });
}, "onRequestOptions");
var onRequest2 = /* @__PURE__ */ __name(async (context2) => {
  const { request, env: env2 } = context2;
  const headers = corsHeaders2(request);
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }
  try {
    const token = getBearerToken2(request);
    let session = null;
    if (token) {
      session = await env2.DB.prepare(`
        SELECT s.token, s.user_id, s.role, u.email, u.name, u.phone, u.login_id
        FROM gym_sessions s
        JOIN gym_users u ON s.user_id = u.id
        WHERE s.token = ? AND datetime(s.expires_at) > datetime('now')
        LIMIT 1
      `).bind(token).first();
    }
    if (request.method === "GET") {
      if (!session) {
        return new Response(JSON.stringify({ error: "Valid session required." }), { status: 401, headers });
      }
      let row = null;
      try {
        row = await env2.DB.prepare(`
          SELECT data, updated_at, version FROM gym_sync_state WHERE id = 'master' LIMIT 1
        `).first();
      } catch {
        row = await env2.DB.prepare(`
          SELECT data, updated_at FROM gym_sync_state WHERE id = 'master' LIMIT 1
        `).first();
      }
      if (!row) {
        return new Response(JSON.stringify({ data: null, version: 1 }), { status: 200, headers });
      }
      let parsed = row.data;
      if (typeof parsed === "string") {
        try {
          parsed = JSON.parse(parsed);
        } catch {
        }
      }
      let inner = parsed && parsed.data ? parsed.data : parsed;
      if (!inner) inner = {};
      if (!Array.isArray(inner.trainers)) inner.trainers = [];
      if (!Array.isArray(inner.clients)) inner.clients = [];
      if (!Array.isArray(inner.messages)) inner.messages = [];
      if (!Array.isArray(inner.weightHistory)) inner.weightHistory = [];
      if (!Array.isArray(inner.loggedMeals)) inner.loggedMeals = [];
      if (!Array.isArray(inner.workoutHistory)) inner.workoutHistory = [];
      if (!Array.isArray(inner.events)) inner.events = [];
      if (!inner.assignedWorkouts) inner.assignedWorkouts = {};
      if (!inner.assignedDietPlans) inner.assignedDietPlans = {};
      if (!Array.isArray(inner.customFoods)) inner.customFoods = [];
      try {
        const dbUsersRes = await env2.DB.prepare(`
          SELECT id, email, name, role, login_id, phone,
                 starting_weight_kg, current_weight_kg, goal_weight_kg,
                 height_cm, goal, trainer_id, trainer_name
          FROM gym_users
        `).all();
        const dbUsers = dbUsersRes?.results || [];
        const dbTrainers = dbUsers.filter((u) => u.role === "TRAINER");
        const dbClients = dbUsers.filter((u) => u.role === "CLIENT");
        for (const t of dbTrainers) {
          let trainerObj = inner.trainers.find(
            (it) => it.id === t.id || it.loginId && t.login_id && it.loginId.toLowerCase() === t.login_id.toLowerCase() || it.email && t.email && it.email.toLowerCase() === t.email.toLowerCase() || it.phone && t.phone && it.phone === t.phone
          );
          if (!trainerObj) {
            trainerObj = {
              id: t.id,
              name: t.name,
              email: t.email,
              phone: t.phone || "",
              role: "Head Strength Coach & Nutritionist",
              status: "Active",
              clientsCount: 0,
              avgAdherence: 95,
              loginId: t.login_id
            };
            inner.trainers.push(trainerObj);
          } else {
            if (!trainerObj.loginId && t.login_id) trainerObj.loginId = t.login_id;
            if (!trainerObj.phone && t.phone) trainerObj.phone = t.phone;
          }
        }
        for (const c of dbClients) {
          let clientObj = inner.clients.find(
            (ic) => ic.id === c.id || ic.loginId && c.login_id && ic.loginId.toLowerCase() === c.login_id.toLowerCase() || ic.email && c.email && ic.email.toLowerCase() === c.email.toLowerCase() || ic.phone && c.phone && ic.phone === c.phone
          );
          if (!clientObj) {
            clientObj = {
              id: c.id,
              name: c.name,
              email: c.email,
              phone: c.phone || "",
              loginId: c.login_id,
              heightCm: c.height_cm || 170,
              startingWeightKg: c.starting_weight_kg || 0,
              currentWeightKg: c.current_weight_kg || 0,
              goal: c.goal || "General Fitness",
              goalWeightKg: c.goal_weight_kg || 0,
              trainerId: c.trainer_id || "",
              trainerName: c.trainer_name || "Unassigned",
              status: "Active",
              firstLoginCompleted: false,
              gymId: "JAWAN-SALEM-01",
              workoutAdherence: 0,
              dietAdherence: 0,
              lastWorkout: "Ready"
            };
            inner.clients.push(clientObj);
          } else {
            if (!clientObj.loginId && c.login_id) clientObj.loginId = c.login_id;
            if (c.trainer_id && c.trainer_id.trim() !== "" && c.trainer_id !== "Unassigned") {
              clientObj.trainerId = c.trainer_id;
              clientObj.trainerName = c.trainer_name || "Assigned Coach";
            } else if (clientObj.trainerId && clientObj.trainerId.trim() !== "" && clientObj.trainerId !== "Unassigned") {
              try {
                await env2.DB.prepare(`
                  UPDATE gym_users
                  SET trainer_id = ?, trainer_name = ?, updated_at = datetime('now')
                  WHERE id = ? OR (login_id IS NOT NULL AND login_id = ?)
                `).bind(clientObj.trainerId, clientObj.trainerName || "Assigned Coach", c.id, c.login_id || "").run();
              } catch {
              }
            }
            if ((!clientObj.startingWeightKg || clientObj.startingWeightKg === 0) && c.starting_weight_kg) {
              clientObj.startingWeightKg = c.starting_weight_kg;
            }
            if ((!clientObj.currentWeightKg || clientObj.currentWeightKg === 0) && c.current_weight_kg) {
              clientObj.currentWeightKg = c.current_weight_kg;
            }
            if ((!clientObj.goalWeightKg || clientObj.goalWeightKg === 0) && c.goal_weight_kg) {
              clientObj.goalWeightKg = c.goal_weight_kg;
            }
            if ((!clientObj.heightCm || clientObj.heightCm === 170) && c.height_cm && c.height_cm !== 170) {
              clientObj.heightCm = c.height_cm;
            }
            if ((!clientObj.goal || clientObj.goal === "General Fitness") && c.goal) {
              clientObj.goal = c.goal;
            }
          }
        }
      } catch (dbErr) {
        console.error("Failed to enrich with gym_users:", dbErr);
      }
      const scoped = scopeStateForRole(inner, session);
      headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0";
      return new Response(JSON.stringify({
        data: scoped,
        version: row?.version || 1,
        updatedAt: row.updated_at
      }), {
        status: 200,
        headers
      });
    }
    if (request.method === "POST") {
      if (!session) {
        return new Response(JSON.stringify({ error: "Valid session required to sync state." }), {
          status: 401,
          headers
        });
      }
      const body = await request.json();
      const parsedBody = typeof body === "string" ? JSON.parse(body) : body;
      let incomingData = parsedBody?.data || parsedBody;
      if (!incomingData || typeof incomingData !== "object") incomingData = {};
      const expectedVersion = typeof parsedBody?.version === "number" ? parsedBody.version : typeof incomingData?.version === "number" ? incomingData.version : null;
      let existingRow = null;
      try {
        existingRow = await env2.DB.prepare(`
          SELECT data, version FROM gym_sync_state WHERE id = 'master' LIMIT 1
        `).first();
      } catch {
        existingRow = await env2.DB.prepare(`
          SELECT data FROM gym_sync_state WHERE id = 'master' LIMIT 1
        `).first();
      }
      if (expectedVersion !== null && existingRow && typeof existingRow.version === "number" && expectedVersion !== existingRow.version) {
        return new Response(JSON.stringify({
          error: "Conflict: sync state has been updated by another client. Please fetch latest state and retry.",
          code: "CONCURRENCY_CONFLICT",
          currentVersion: existingRow.version,
          clientVersion: expectedVersion
        }), {
          status: 409,
          headers
        });
      }
      let existingState = {};
      if (existingRow?.data) {
        try {
          const ep = JSON.parse(existingRow.data);
          existingState = ep?.data || ep || {};
        } catch {
        }
      }
      let mergedPayload;
      if (session.role === "ADMIN") {
        if ((!incomingData.trainers || incomingData.trainers.length === 0) && existingState.trainers?.length > 0) {
          incomingData.trainers = existingState.trainers;
        }
        if ((!incomingData.clients || incomingData.clients.length === 0) && existingState.clients?.length > 0) {
          incomingData.clients = existingState.clients;
        }
        const msgMap = /* @__PURE__ */ new Map();
        if (Array.isArray(existingState.messages)) {
          for (const m of existingState.messages) {
            if (m && m.id) msgMap.set(m.id, m);
          }
        }
        if (Array.isArray(incomingData.messages)) {
          for (const m of incomingData.messages) {
            if (m && m.id) msgMap.set(m.id, m);
          }
        }
        const mergedMessages = Array.from(msgMap.values()).sort(
          (a, b) => Number(a.timestamp || 0) - Number(b.timestamp || 0)
        );
        const mergedWorkouts = {
          ...existingState.assignedWorkouts || {},
          ...incomingData.assignedWorkouts || {}
        };
        const mergedDietPlans = {
          ...existingState.assignedDietPlans || {},
          ...incomingData.assignedDietPlans || {}
        };
        mergedPayload = {
          clients: incomingData.clients || existingState.clients || [],
          trainers: incomingData.trainers || existingState.trainers || [],
          assignedWorkouts: mergedWorkouts,
          assignedDietPlans: mergedDietPlans,
          workoutHistory: incomingData.workoutHistory || existingState.workoutHistory || [],
          loggedMeals: incomingData.loggedMeals || existingState.loggedMeals || [],
          weightHistory: incomingData.weightHistory || existingState.weightHistory || [],
          events: incomingData.events || existingState.events || [],
          messages: mergedMessages,
          customFoods: incomingData.customFoods || existingState.customFoods || [],
          dailyWaterLog: incomingData.dailyWaterLog || existingState.dailyWaterLog || {}
        };
      } else {
        mergedPayload = mergeNonAdminPost(incomingData, existingState, session);
      }
      mergedPayload.clients = stripSecrets(mergedPayload.clients);
      mergedPayload.trainers = stripSecrets(mergedPayload.trainers);
      const nextVersion = (existingRow?.version ? Number(existingRow.version) : 1) + 1;
      try {
        await env2.DB.prepare(`
          INSERT INTO gym_sync_state (id, data, updated_at, version)
          VALUES ('master', ?, datetime('now'), ?)
          ON CONFLICT(id) DO UPDATE SET
            data = excluded.data,
            version = COALESCE(gym_sync_state.version, 1) + 1,
            updated_at = datetime('now');
        `).bind(JSON.stringify({ data: mergedPayload }), nextVersion).run();
      } catch {
        await env2.DB.prepare(`
          INSERT INTO gym_sync_state (id, data, updated_at)
          VALUES ('master', ?, datetime('now'))
          ON CONFLICT(id) DO UPDATE SET
            data = excluded.data,
            updated_at = datetime('now');
        `).bind(JSON.stringify({ data: mergedPayload })).run();
      }
      if (session.role === "ADMIN") {
        try {
          const clientList = Array.isArray(mergedPayload.clients) ? mergedPayload.clients : [];
          for (const cl of clientList) {
            if (cl.id || cl.loginId) {
              await env2.DB.prepare(`
                UPDATE gym_users
                SET trainer_id = ?, trainer_name = ?, updated_at = datetime('now')
                WHERE id = ? OR (login_id IS NOT NULL AND login_id = ?)
              `).bind(cl.trainerId || "", cl.trainerName || "Unassigned", cl.id || "", cl.loginId || "").run();
            }
          }
        } catch (userSyncErr) {
          console.error("Failed to sync clients to gym_users:", userSyncErr);
        }
      }
      headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0";
      return new Response(JSON.stringify({
        success: true,
        version: nextVersion,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      }), {
        status: 200,
        headers
      });
    }
    return new Response(JSON.stringify({ error: `Method ${request.method} not allowed` }), {
      status: 405,
      headers
    });
  } catch (error3) {
    return new Response(JSON.stringify({ error: error3?.message || "Sync error" }), {
      status: 500,
      headers
    });
  }
}, "onRequest");

// ../.wrangler/tmp/pages-zvEKPm/functionsRoutes-0.8445047038594776.mjs
var routes = [
  {
    routePath: "/api/auth",
    mountPath: "/api",
    method: "OPTIONS",
    middlewares: [],
    modules: [onRequestOptions]
  },
  {
    routePath: "/api/sync",
    mountPath: "/api",
    method: "OPTIONS",
    middlewares: [],
    modules: [onRequestOptions2]
  },
  {
    routePath: "/api/auth",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest]
  },
  {
    routePath: "/api/sync",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest2]
  }
];

// ../../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/path-to-regexp/dist.es2015/index.js
function lexer(str) {
  var tokens = [];
  var i = 0;
  while (i < str.length) {
    var char = str[i];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str[i++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str[i++] });
      continue;
    }
    if (char === ":") {
      var name = "";
      var j = i + 1;
      while (j < str.length) {
        var code = str.charCodeAt(j);
        if (
          // `0-9`
          code >= 48 && code <= 57 || // `A-Z`
          code >= 65 && code <= 90 || // `a-z`
          code >= 97 && code <= 122 || // `_`
          code === 95
        ) {
          name += str[j++];
          continue;
        }
        break;
      }
      if (!name)
        throw new TypeError("Missing parameter name at ".concat(i));
      tokens.push({ type: "NAME", index: i, value: name });
      i = j;
      continue;
    }
    if (char === "(") {
      var count3 = 1;
      var pattern = "";
      var j = i + 1;
      if (str[j] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j));
      }
      while (j < str.length) {
        if (str[j] === "\\") {
          pattern += str[j++] + str[j++];
          continue;
        }
        if (str[j] === ")") {
          count3--;
          if (count3 === 0) {
            j++;
            break;
          }
        } else if (str[j] === "(") {
          count3++;
          if (str[j + 1] !== "?") {
            throw new TypeError("Capturing groups are not allowed at ".concat(j));
          }
        }
        pattern += str[j++];
      }
      if (count3)
        throw new TypeError("Unbalanced pattern at ".concat(i));
      if (!pattern)
        throw new TypeError("Missing pattern at ".concat(i));
      tokens.push({ type: "PATTERN", index: i, value: pattern });
      i = j;
      continue;
    }
    tokens.push({ type: "CHAR", index: i, value: str[i++] });
  }
  tokens.push({ type: "END", index: i, value: "" });
  return tokens;
}
__name(lexer, "lexer");
function parse(str, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer(str);
  var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a, _b = options.delimiter, delimiter = _b === void 0 ? "/#?" : _b;
  var result = [];
  var key = 0;
  var i = 0;
  var path = "";
  var tryConsume = /* @__PURE__ */ __name(function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value;
  }, "tryConsume");
  var mustConsume = /* @__PURE__ */ __name(function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a2 = tokens[i], nextType = _a2.type, index = _a2.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  }, "mustConsume");
  var consumeText = /* @__PURE__ */ __name(function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  }, "consumeText");
  var isSafe = /* @__PURE__ */ __name(function(value2) {
    for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      var char2 = delimiter_1[_i];
      if (value2.indexOf(char2) > -1)
        return true;
    }
    return false;
  }, "isSafe");
  var safePattern = /* @__PURE__ */ __name(function(prefix2) {
    var prev = result[result.length - 1];
    var prevText = prefix2 || (prev && typeof prev === "string" ? prev : "");
    if (prev && !prevText) {
      throw new TypeError('Must have text between two parameters, missing text after "'.concat(prev.name, '"'));
    }
    if (!prevText || isSafe(prevText))
      return "[^".concat(escapeString(delimiter), "]+?");
    return "(?:(?!".concat(escapeString(prevText), ")[^").concat(escapeString(delimiter), "])+?");
  }, "safePattern");
  while (i < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path += prefix;
        prefix = "";
      }
      if (path) {
        result.push(path);
        path = "";
      }
      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || safePattern(prefix),
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path += value;
      continue;
    }
    if (path) {
      result.push(path);
      path = "";
    }
    var open = tryConsume("OPEN");
    if (open) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? safePattern(prefix) : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
__name(parse, "parse");
function match(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
__name(match, "match");
function regexpToFunction(re, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.decode, decode = _a === void 0 ? function(x) {
    return x;
  } : _a;
  return function(pathname) {
    var m = re.exec(pathname);
    if (!m)
      return false;
    var path = m[0], index = m.index;
    var params = /* @__PURE__ */ Object.create(null);
    var _loop_1 = /* @__PURE__ */ __name(function(i2) {
      if (m[i2] === void 0)
        return "continue";
      var key = keys[i2 - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m[i2].split(key.prefix + key.suffix).map(function(value) {
          return decode(value, key);
        });
      } else {
        params[key.name] = decode(m[i2], key);
      }
    }, "_loop_1");
    for (var i = 1; i < m.length; i++) {
      _loop_1(i);
    }
    return { path, index, params };
  };
}
__name(regexpToFunction, "regexpToFunction");
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
__name(escapeString, "escapeString");
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
__name(flags, "flags");
function regexpToRegexp(path, keys) {
  if (!keys)
    return path;
  var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  var index = 0;
  var execResult = groupsRegex.exec(path.source);
  while (execResult) {
    keys.push({
      // Use parenthesized substring match if available, index otherwise
      name: execResult[1] || index++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    });
    execResult = groupsRegex.exec(path.source);
  }
  return path;
}
__name(regexpToRegexp, "regexpToRegexp");
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
__name(arrayToRegexp, "arrayToRegexp");
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options);
}
__name(stringToRegexp, "stringToRegexp");
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode = _d === void 0 ? function(x) {
    return x;
  } : _d, _e = options.delimiter, delimiter = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
  var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
  var delimiterRe = "[".concat(escapeString(delimiter), "]");
  var route = start ? "^" : "";
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route += escapeString(encode(token));
    } else {
      var prefix = escapeString(encode(token.prefix));
      var suffix = escapeString(encode(token.suffix));
      if (token.pattern) {
        if (keys)
          keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod = token.modifier === "*" ? "?" : "";
            route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
          } else {
            route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            throw new TypeError('Can not repeat "'.concat(token.name, '" without a prefix and suffix'));
          }
          route += "(".concat(token.pattern, ")").concat(token.modifier);
        }
      } else {
        route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict)
      route += "".concat(delimiterRe, "?");
    route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
    if (!strict) {
      route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route, flags(options));
}
__name(tokensToRegexp, "tokensToRegexp");
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp)
    return regexpToRegexp(path, keys);
  if (Array.isArray(path))
    return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
__name(pathToRegexp, "pathToRegexp");

// ../../../../../AppData/Roaming/npm/node_modules/wrangler/templates/pages-template-worker.ts
var escapeRegex = /[.+?^${}()|[\]\\]/g;
function* executeRequest(request) {
  const requestPath = new URL(request.url).pathname;
  for (const route of [...routes].reverse()) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult) {
      for (const handler of route.middlewares.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: mountMatchResult.path
        };
      }
    }
  }
  for (const route of routes) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: true
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult && route.modules.length) {
      for (const handler of route.modules.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: matchResult.path
        };
      }
      break;
    }
  }
}
__name(executeRequest, "executeRequest");
var pages_template_worker_default = {
  async fetch(originalRequest, env2, workerContext) {
    let request = originalRequest;
    const handlerIterator = executeRequest(request);
    let data = {};
    let isFailOpen = false;
    const next = /* @__PURE__ */ __name(async (input, init) => {
      if (input !== void 0) {
        let url = input;
        if (typeof input === "string") {
          url = new URL(input, request.url).toString();
        }
        request = new Request(url, init);
      }
      const result = handlerIterator.next();
      if (result.done === false) {
        const { handler, params, path } = result.value;
        const context2 = {
          request: new Request(request.clone()),
          functionPath: path,
          next,
          params,
          get data() {
            return data;
          },
          set data(value) {
            if (typeof value !== "object" || value === null) {
              throw new Error("context.data must be an object");
            }
            data = value;
          },
          env: env2,
          waitUntil: workerContext.waitUntil.bind(workerContext),
          passThroughOnException: /* @__PURE__ */ __name(() => {
            isFailOpen = true;
          }, "passThroughOnException")
        };
        const response = await handler(context2);
        if (!(response instanceof Response)) {
          throw new Error("Your Pages function should return a Response");
        }
        return cloneResponse(response);
      } else if ("ASSETS") {
        const response = await env2["ASSETS"].fetch(request);
        return cloneResponse(response);
      } else {
        const response = await fetch(request);
        return cloneResponse(response);
      }
    }, "next");
    try {
      return await next();
    } catch (error3) {
      if (isFailOpen) {
        const response = await env2["ASSETS"].fetch(request);
        return cloneResponse(response);
      }
      throw error3;
    }
  }
};
var cloneResponse = /* @__PURE__ */ __name((response) => (
  // https://fetch.spec.whatwg.org/#null-body-status
  new Response(
    [101, 204, 205, 304].includes(response.status) ? null : response.body,
    response
  )
), "cloneResponse");
export {
  pages_template_worker_default as default
};
