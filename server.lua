
-- run `lit install creationix/weblit` to get dependencies.

local stringify = require('json').stringify

local fs = require('coro-fs').chroot(module.dir)
local function linker(path)
  local js = {}
  local queue = {path}
  while #queue > 0 do
    path = queue[#queue]
    queue[#queue] = nil
    js[path] = fs.readFile(path)
    if js[path] then
      local offset = 1
      while true do
        local a, b, r, m = js[path]:find("(require)(%b())", offset)
        if not a then break end
        local c, d, m2 = m:find("([^()'\"]+)")
        if not c then break end
        local subpath = "modules/" .. m2 .. ".js"
        offset = a + 1
        m = m:sub(1, c - 1) .. subpath .. m:sub(d + 1)
        js[path] = js[path]:sub(1, a - 1) .. r .. m .. js[path]:sub(b + 1)
        if not js[subpath] then
          queue[#queue + 1] = subpath
        end
      end
    end
  end
  local parts = {}
  for k,v in pairs(js) do
    parts[#parts + 1] = string.format("window[%s] = function (module, exports, require) {\n%s\n};", stringify(k), v)
  end
  return table.concat(parts, "\n")
end

require('weblit-app')

  .bind({
    host = "0.0.0.0",
    port = 8080
  })

  .use(require('weblit-logger'))
  .use(require('weblit-auto-headers'))
  .use(require('weblit-etag-cache'))

  .route({
    method = "GET",
    path = "/src/:script.js",
  }, function (req, res, go)

    local path = "src/" .. req.params.script .. ".js"
    local js = linker(path)
    if not js then return go() end

    res.code = 200
    res.headers["Content-Type"] = "application/javascript"
    res.body = js

  end)

  .use(require('weblit-static')("www"))

  .start()
