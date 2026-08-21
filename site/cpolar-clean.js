(function () {
  "use strict";

  var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var canvas = document.getElementById("cp-mountain");
  var cloudCanvas = document.getElementById("cp-cloud-volume");
  var dustCanvas = document.getElementById("cp-dust");
  var journeyFilm = document.getElementById("cp-journey-film");
  var hero = document.getElementById("hero");
  var about = document.getElementById("WhoWeAre");
  var pollutants = document.getElementById("WhatWeDo");
  if (!canvas || !dustCanvas || !hero || !about || !pollutants) return;

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function smoothstep(value) {
    value = clamp(value, 0, 1);
    return value * value * (3 - 2 * value);
  }

  function pulse(value, start, peak, end) {
    return smoothstep((value - start) / Math.max(.0001, peak - start)) *
      (1 - smoothstep((value - peak) / Math.max(.0001, end - peak)));
  }

  /* -----------------------------------------------------------------------
     C-POLAR-owned mountain runtime.
     Loads the original C-POLAR Blender GLB and its embedded normal map. The
     compact generated mesh below is retained only as a resilient fallback;
     no third-party model, texture, EXR or inherited WebGL runtime is loaded.
     --------------------------------------------------------------------- */
  function createMountain() {
    var contextOptions = {
      alpha: true,
      antialias: true,
      powerPreference: "high-performance"
    };
    var gl = canvas.getContext("webgl", contextOptions) ||
      canvas.getContext("experimental-webgl", contextOptions);
    if (!gl) return null;

    var vertexSource = [
      "attribute vec3 aPosition;",
      "attribute vec3 aNormal;",
      "attribute vec4 aTangent;",
      "attribute vec2 aUv;",
      "uniform mat4 uMvp;",
      "uniform mat4 uModel;",
      "varying vec3 vNormal;",
      "varying vec3 vTangent;",
      "varying vec3 vBitangent;",
      "varying float vHeight;",
      "varying vec3 vWorld;",
      "varying vec2 vUv;",
      "void main(){",
      "  vec4 world = uModel * vec4(aPosition, 1.0);",
      "  vWorld = world.xyz;",
      "  vNormal = normalize(mat3(uModel) * aNormal);",
      "  vTangent = normalize(mat3(uModel) * aTangent.xyz);",
      "  vBitangent = normalize(cross(vNormal, vTangent) * aTangent.w);",
      "  vHeight = aPosition.y;",
      "  vUv = aUv;",
      "  gl_Position = uMvp * vec4(aPosition, 1.0);",
      "}"
    ].join("\n");

    var fragmentSource = [
      "precision mediump float;",
      "varying vec3 vNormal;",
      "varying vec3 vTangent;",
      "varying vec3 vBitangent;",
      "varying float vHeight;",
      "varying vec3 vWorld;",
      "varying vec2 vUv;",
      "uniform float uMist;",
      "uniform vec3 uEye;",
      "uniform sampler2D uSurfaceNormal;",
      "uniform sampler2D uSurfaceColor;",
      "void main(){",
      "  vec3 coarseNormal = texture2D(uSurfaceNormal, vUv * 2.25).xyz * 2.0 - 1.0;",
      "  vec3 fineNormal = texture2D(uSurfaceNormal, vUv * 11.0 + vec2(.17,.43)).xyz * 2.0 - 1.0;",
      "  vec2 relief = coarseNormal.xy * .245 + fineNormal.xy * .072;",
      "  vec3 tangentNormal = normalize(vec3(relief, 1.0));",
      "  mat3 tangentFrame = mat3(normalize(vTangent), normalize(vBitangent), normalize(vNormal));",
      "  vec3 n = normalize(tangentFrame * tangentNormal);",
      "  vec3 textureSample = texture2D(uSurfaceColor, vUv).rgb;",
      "  textureSample = clamp((textureSample - vec3(.50)) * 1.34 + vec3(.50), 0.0, 1.0);",
      "  float rockVariation = dot(textureSample, vec3(.2126,.7152,.0722));",
      "  float bakedSnow = smoothstep(.72, .91, rockVariation);",
      "  vec3 rockTint = mix(vec3(.74,.83,.90), vec3(.96,.98,1.0), smoothstep(.30,.88,rockVariation));",
      "  vec3 rock = textureSample * mix(vec3(.93,.96,.98), rockTint, .22);",
      "  float elevationSnow = smoothstep(.72, 4.55, vHeight);",
      "  float slopeSnow = smoothstep(.30, .78, n.y);",
      "  float windwardSnow = smoothstep(.20, .72, dot(n, normalize(vec3(-.38,.88,.18))));",
      "  float snowScore = elevationSnow * .34 + slopeSnow * .27 + windwardSnow * elevationSnow * .13 + bakedSnow * .10;",
      "  float snow = smoothstep(.36, .70, snowScore) * smoothstep(-.15, 3.75, vHeight);",
      "  snow = snow * snow * (3.0 - 2.0 * snow);",
      "  vec3 snowColor = mix(vec3(.78,.86,.92), vec3(.965,.982,.996), .36 + slopeSnow * .54);",
      "  vec3 surface = mix(rock, mix(textureSample, snowColor, .52), snow * .62);",
      "  vec3 lightDir = normalize(vec3(-0.62, 0.70, 0.34));",
      "  vec3 viewDir = normalize(uEye - vWorld);",
      "  vec3 halfDir = normalize(lightDir + viewDir);",
      "  float diffuse = max(dot(n, lightDir), 0.0);",
      "  float ambient = .72 + clamp(n.y, 0.0, 1.0) * .08;",
      "  float specular = pow(max(dot(n, halfDir), 0.0), 64.0);",
      "  float rim = pow(1.0 - max(dot(n, viewDir), 0.0), 3.2);",
      "  vec3 color = surface * (ambient + diffuse * .26);",
      "  color *= mix(vec3(.91,.95,.98), vec3(1.0), diffuse * .38 + .48);",
      "  color += specular * mix(.004, .022, snow) * vec3(.80,.91,1.0);",
      "  color += rim * .008 * vec3(.38,.58,.76);",
      "  float depthMist = smoothstep(-5.5, 7.0, -vWorld.z) * uMist;",
      "  color = mix(color, vec3(.82,.89,.94), depthMist * .42);",
      "  color = pow(max(color, vec3(0.0)), vec3(.97));",
      "  float edgeFade = smoothstep(-1.46, -.48, vHeight);",
      "  gl_FragColor = vec4(color, edgeFade);",
      "}"
    ].join("\n");

    function shader(type, source) {
      var item = gl.createShader(type);
      gl.shaderSource(item, source);
      gl.compileShader(item);
      if (!gl.getShaderParameter(item, gl.COMPILE_STATUS)) {
        console.warn(gl.getShaderInfoLog(item));
        gl.deleteShader(item);
        return null;
      }
      return item;
    }

    var program = gl.createProgram();
    gl.attachShader(program, shader(gl.VERTEX_SHADER, vertexSource));
    gl.attachShader(program, shader(gl.FRAGMENT_SHADER, fragmentSource));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
    gl.useProgram(program);

    // Cache attribute locations once. Re-applying these pointers after the
    // asynchronous GLB upload avoids retaining fallback-buffer state on
    // Safari and on Chromium's software WebGL implementation.
    var positionLocation = gl.getAttribLocation(program, "aPosition");
    var normalLocation = gl.getAttribLocation(program, "aNormal");
    var tangentLocation = gl.getAttribLocation(program, "aTangent");
    var uvLocation = gl.getAttribLocation(program, "aUv");

    var segments = innerWidth < 700 ? 72 : 116;
    var side = segments + 1;
    var positions = new Float32Array(side * side * 3);
    var normals = new Float32Array(side * side * 3);
    var tangents = new Float32Array(side * side * 4);
    var uvs = new Float32Array(side * side * 2);
    var indices = new Uint16Array(segments * segments * 6);
    var heights = new Float32Array(side * side);

    function hash(x, z) {
      var value = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
      return value - Math.floor(value);
    }

    function noise(x, z) {
      var xi = Math.floor(x), zi = Math.floor(z);
      var xf = x - xi, zf = z - zi;
      var u = xf * xf * (3 - 2 * xf);
      var v = zf * zf * (3 - 2 * zf);
      var a = hash(xi, zi), b = hash(xi + 1, zi);
      var c = hash(xi, zi + 1), d = hash(xi + 1, zi + 1);
      return (a + (b - a) * u) + ((c + (d - c) * u) - (a + (b - a) * u)) * v;
    }

    function fbm(x, z) {
      var total = 0, amplitude = .5, frequency = 1;
      for (var octave = 0; octave < 5; octave++) {
        total += noise(x * frequency, z * frequency) * amplitude;
        frequency *= 2.04;
        amplitude *= .48;
      }
      return total;
    }

    var worldSize = 17;
    for (var z = 0; z < side; z++) {
      for (var x = 0; x < side; x++) {
        var nx = x / segments * 2 - 1;
        var nz = z / segments * 2 - 1;
        var broad = Math.max(0, 1 - Math.sqrt(nx * nx * .78 + nz * nz * 1.14));
        var shoulder = Math.max(0, 1 - Math.sqrt((nx + .38) * (nx + .38) * 1.65 + (nz + .05) * (nz + .05) * 2.1));
        var ridge = Math.max(0, 1 - Math.abs(nx * .62 + nz * .24) * 2.45) * broad;
        var detail = fbm(nx * 3.2 + 4.1, nz * 3.2 - 2.7);
        var strata = Math.sin((nx * 5.1 - nz * 2.4 + detail) * 5.0) * .12 * broad;
        var h = Math.pow(broad, 1.72) * 6.15 +
          Math.pow(shoulder, 2.2) * 1.6 +
          Math.pow(ridge, 2.7) * 1.15 +
          (detail - .48) * 1.18 * broad +
          strata;
        h -= 1.55;
        heights[z * side + x] = h;
        var p = (z * side + x) * 3;
        positions[p] = nx * worldSize * .5;
        positions[p + 1] = h;
        positions[p + 2] = nz * worldSize * .5;
        var uvOffset = (z * side + x) * 2;
        uvs[uvOffset] = x / segments;
        uvs[uvOffset + 1] = z / segments;
        var tangentOffset = (z * side + x) * 4;
        tangents[tangentOffset] = 1;
        tangents[tangentOffset + 1] = 0;
        tangents[tangentOffset + 2] = 0;
        tangents[tangentOffset + 3] = 1;
      }
    }

    function heightAt(x, z) {
      x = clamp(x, 0, segments);
      z = clamp(z, 0, segments);
      return heights[z * side + x];
    }

    for (var nzIndex = 0; nzIndex < side; nzIndex++) {
      for (var nxIndex = 0; nxIndex < side; nxIndex++) {
        var left = heightAt(nxIndex - 1, nzIndex);
        var right = heightAt(nxIndex + 1, nzIndex);
        var down = heightAt(nxIndex, nzIndex - 1);
        var up = heightAt(nxIndex, nzIndex + 1);
        var normalX = left - right;
        var normalY = worldSize * 2 / segments;
        var normalZ = down - up;
        var length = Math.hypot(normalX, normalY, normalZ) || 1;
        var normalOffset = (nzIndex * side + nxIndex) * 3;
        normals[normalOffset] = normalX / length;
        normals[normalOffset + 1] = normalY / length;
        normals[normalOffset + 2] = normalZ / length;
      }
    }

    var cursor = 0;
    for (var iz = 0; iz < segments; iz++) {
      for (var ix = 0; ix < segments; ix++) {
        var a = iz * side + ix;
        var b = a + 1;
        var c = a + side;
        var d = c + 1;
        indices[cursor++] = a; indices[cursor++] = c; indices[cursor++] = b;
        indices[cursor++] = b; indices[cursor++] = c; indices[cursor++] = d;
      }
    }

    function buffer(attribute, data, size) {
      var item = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, item);
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
      var location = {
        aPosition: positionLocation,
        aNormal: normalLocation,
        aTangent: tangentLocation,
        aUv: uvLocation
      }[attribute];
      gl.enableVertexAttribArray(location);
      gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);
      return item;
    }

    var positionBuffer = buffer("aPosition", positions, 3);
    var normalBuffer = buffer("aNormal", normals, 3);
    var tangentBuffer = buffer("aTangent", tangents, 4);
    var uvBuffer = buffer("aUv", uvs, 2);
    var indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
    var drawCount = indices.length;
    var indexType = gl.UNSIGNED_SHORT;
    var normalTexture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, normalTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
      new Uint8Array([128, 128, 255, 255]));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    var colorTexture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, colorTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
      new Uint8Array([150, 172, 190, 255]));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    function componentCount(type) {
      return { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 }[type] || 1;
    }

    function typedAccessor(glb, json, accessorIndex) {
      var accessor = json.accessors[accessorIndex];
      var view = json.bufferViews[accessor.bufferView];
      var count = accessor.count * componentCount(accessor.type);
      var byteOffset = glb.byteOffset + (view.byteOffset || 0) + (accessor.byteOffset || 0);
      var Constructor = {
        5121: Uint8Array,
        5123: Uint16Array,
        5125: Uint32Array,
        5126: Float32Array
      }[accessor.componentType];
      if (!Constructor) throw new Error("Unsupported GLB component type " + accessor.componentType);
      var packedStride = Constructor.BYTES_PER_ELEMENT * componentCount(accessor.type);
      if (!view.byteStride || view.byteStride === packedStride) {
        return new Constructor(glb.buffer, byteOffset, count);
      }
      var unpacked = new Constructor(count);
      var source = new DataView(glb.buffer);
      var components = componentCount(accessor.type);
      var littleEndian = true;
      for (var itemIndex = 0; itemIndex < accessor.count; itemIndex++) {
        for (var componentIndex = 0; componentIndex < components; componentIndex++) {
          var address = byteOffset + itemIndex * view.byteStride + componentIndex * Constructor.BYTES_PER_ELEMENT;
          var targetIndex = itemIndex * components + componentIndex;
          if (accessor.componentType === 5126) unpacked[targetIndex] = source.getFloat32(address, littleEndian);
          else if (accessor.componentType === 5125) unpacked[targetIndex] = source.getUint32(address, littleEndian);
          else if (accessor.componentType === 5123) unpacked[targetIndex] = source.getUint16(address, littleEndian);
          else unpacked[targetIndex] = source.getUint8(address);
        }
      }
      return unpacked;
    }

    function parseGlb(arrayBuffer) {
      var header = new DataView(arrayBuffer, 0, 12);
      if (header.getUint32(0, true) !== 0x46546c67 || header.getUint32(4, true) !== 2) {
        throw new Error("Invalid GLB header");
      }
      var json = null;
      var binary = null;
      var offset = 12;
      while (offset < arrayBuffer.byteLength) {
        var chunkHeader = new DataView(arrayBuffer, offset, 8);
        var chunkLength = chunkHeader.getUint32(0, true);
        var chunkType = chunkHeader.getUint32(4, true);
        var chunkOffset = offset + 8;
        if (chunkType === 0x4e4f534a) {
          var jsonText = new TextDecoder().decode(new Uint8Array(arrayBuffer, chunkOffset, chunkLength));
          json = JSON.parse(jsonText.trim());
        } else if (chunkType === 0x004e4942) {
          binary = { buffer: arrayBuffer, byteOffset: chunkOffset };
        }
        offset = chunkOffset + chunkLength;
      }
      if (!json || !binary) throw new Error("GLB is missing JSON or binary data");
      return { json: json, binary: binary };
    }

    function uploadMountain(arrayBuffer) {
      var parsed = parseGlb(arrayBuffer);
      var primitive = parsed.json.meshes[0].primitives[0];
      var loadedPositions = typedAccessor(parsed.binary, parsed.json, primitive.attributes.POSITION);
      var loadedNormals = typedAccessor(parsed.binary, parsed.json, primitive.attributes.NORMAL);
      var loadedTangents = primitive.attributes.TANGENT !== undefined ?
        typedAccessor(parsed.binary, parsed.json, primitive.attributes.TANGENT) : null;
      var loadedUvs = typedAccessor(parsed.binary, parsed.json, primitive.attributes.TEXCOORD_0);
      var loadedIndices = typedAccessor(parsed.binary, parsed.json, primitive.indices);
      var indexAccessor = parsed.json.accessors[primitive.indices];

      if (indexAccessor.componentType === 5125 && !gl.getExtension("OES_element_index_uint")) {
        throw new Error("32-bit mountain indices are unsupported on this device");
      }
      indexType = indexAccessor.componentType === 5125 ? gl.UNSIGNED_INT :
        indexAccessor.componentType === 5121 ? gl.UNSIGNED_BYTE : gl.UNSIGNED_SHORT;
      drawCount = indexAccessor.count;

      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, loadedPositions, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, loadedNormals, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(normalLocation);
      gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, 0, 0);
      if (loadedTangents) {
        gl.bindBuffer(gl.ARRAY_BUFFER, tangentBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, loadedTangents, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(tangentLocation);
        gl.vertexAttribPointer(tangentLocation, 4, gl.FLOAT, false, 0, 0);
      }
      gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, loadedUvs, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(uvLocation);
      gl.vertexAttribPointer(uvLocation, 2, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, loadedIndices, gl.STATIC_DRAW);
      var geometryUploadError = gl.getError();
      if (geometryUploadError !== gl.NO_ERROR) {
        throw new Error("Mountain geometry upload failed: " + geometryUploadError);
      }
      // Serve the authored textures as normal HTTP assets. Extracting images
      // from an embedded GLB Blob proved unreliable on Safari and Chromium's
      // software WebGL path even though decode callbacks reported success.
      uploadTextureUrl("./assets/models/cpolar/source/cpolar-rock-normal.png?v=20260804-mf2", normalTexture, gl.TEXTURE0, "cp-mountain-normal-ready");
      uploadTextureUrl("./assets/models/cpolar/source/cpolar-snow-rock-albedo.png?v=20260804-mf2", colorTexture, gl.TEXTURE1, "cp-mountain-color-ready");
      document.documentElement.classList.add("cp-mountain-glb-ready");
      onScroll();
    }

    function uploadTextureUrl(url, textureObject, textureUnit, readyClass) {
      var image = new Image();
      image.onload = function () {
        gl.activeTexture(textureUnit);
        gl.bindTexture(gl.TEXTURE_2D, textureObject);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.generateMipmap(gl.TEXTURE_2D);
        var uploadError = gl.getError();
        if (uploadError !== gl.NO_ERROR) {
          console.warn("C-POLAR texture upload failed:", readyClass, uploadError);
          return;
        }
        document.documentElement.classList.add(readyClass);
        onScroll();
      };
      image.onerror = function () { console.warn("C-POLAR texture request failed:", url); };
      image.src = url;
    }

    function uploadEmbeddedTexture(parsed, textureIndex, textureObject, textureUnit, readyClass) {
      if (textureIndex === undefined || !parsed.json.textures || !parsed.json.images) return;
      var textureInfo = parsed.json.textures[textureIndex];
      if (!textureInfo) return;
      var imageInfo = parsed.json.images[textureInfo.source];
      if (!imageInfo || imageInfo.bufferView === undefined) return;
      var imageView = parsed.json.bufferViews[imageInfo.bufferView];
      var bytes = new Uint8Array(parsed.binary.buffer,
        parsed.binary.byteOffset + (imageView.byteOffset || 0), imageView.byteLength);
      var blob = new Blob([bytes], { type: imageInfo.mimeType || "image/png" });

      function install(image) {
        gl.activeTexture(textureUnit);
        gl.bindTexture(gl.TEXTURE_2D, textureObject);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.generateMipmap(gl.TEXTURE_2D);
        var uploadError = gl.getError();
        if (uploadError !== gl.NO_ERROR) {
          console.warn("C-POLAR texture upload failed:", readyClass, uploadError);
          return;
        }
        document.documentElement.classList.add(readyClass);
        onScroll();
      }

      // This path is deliberately preferred over createImageBitmap(blob).
      // Safari and Chromium/SwiftShader can resolve that promise while
      // silently retaining the previous 1x1 texture on the WebGL sampler.
      var image = new Image();
      var objectUrl = URL.createObjectURL(blob);
      image.onload = function () {
        install(image);
        URL.revokeObjectURL(objectUrl);
      };
      image.onerror = function () {
        URL.revokeObjectURL(objectUrl);
        console.warn("C-POLAR texture decode failed:", readyClass);
      };
      image.src = objectUrl;
    }

    function uploadNormalTexture(parsed, primitive) {
      var material = parsed.json.materials && parsed.json.materials[primitive.material];
      if (!material || !material.normalTexture) return;
      uploadEmbeddedTexture(parsed, material.normalTexture.index, normalTexture, gl.TEXTURE0, "cp-mountain-normal-ready");
    }

    function uploadColorTexture(parsed, primitive) {
      var material = parsed.json.materials && parsed.json.materials[primitive.material];
      var base = material && material.pbrMetallicRoughness && material.pbrMetallicRoughness.baseColorTexture;
      if (!base) return;
      uploadEmbeddedTexture(parsed, base.index, colorTexture, gl.TEXTURE1, "cp-mountain-color-ready");
    }

    var mountainUrl = innerWidth < 700 ?
      "./assets/models/cpolar/cpolar-mountain-mobile.glb?v=20260804-mf2" :
      "./assets/models/cpolar/cpolar-mountain-desktop.glb?v=20260804-mf2";
    fetch(mountainUrl, { cache: "no-cache" })
      .then(function (response) {
        if (!response.ok) throw new Error("Mountain GLB request failed: " + response.status);
        return response.arrayBuffer();
      })
      .then(uploadMountain)
      .catch(function (error) {
        console.warn("C-POLAR mountain fallback active.", error);
      });

    var mvpLocation = gl.getUniformLocation(program, "uMvp");
    var modelLocation = gl.getUniformLocation(program, "uModel");
    var mistLocation = gl.getUniformLocation(program, "uMist");
    var eyeLocation = gl.getUniformLocation(program, "uEye");
    var normalTextureLocation = gl.getUniformLocation(program, "uSurfaceNormal");
    var colorTextureLocation = gl.getUniformLocation(program, "uSurfaceColor");
    gl.uniform1i(normalTextureLocation, 0);
    gl.uniform1i(colorTextureLocation, 1);

    function perspective(fov, aspect, near, far) {
      var f = 1 / Math.tan(fov / 2), nf = 1 / (near - far);
      return new Float32Array([
        f / aspect,0,0,0, 0,f,0,0, 0,0,(far + near) * nf,-1, 0,0,2 * far * near * nf,0
      ]);
    }

    function multiply(a, b) {
      var out = new Float32Array(16);
      for (var column = 0; column < 4; column++) {
        for (var row = 0; row < 4; row++) {
          out[column * 4 + row] =
            a[row] * b[column * 4] +
            a[4 + row] * b[column * 4 + 1] +
            a[8 + row] * b[column * 4 + 2] +
            a[12 + row] * b[column * 4 + 3];
        }
      }
      return out;
    }

    function normalize(vector) {
      var length = Math.hypot(vector[0], vector[1], vector[2]) || 1;
      return [vector[0] / length, vector[1] / length, vector[2] / length];
    }

    function subtract(a, b) {
      return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
    }

    function cross(a, b) {
      return [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
    }

    function lookAt(eye, target, up) {
      var zAxis = normalize(subtract(eye, target));
      var xAxis = normalize(cross(up, zAxis));
      var yAxis = cross(zAxis, xAxis);
      return new Float32Array([
        xAxis[0],yAxis[0],zAxis[0],0,
        xAxis[1],yAxis[1],zAxis[1],0,
        xAxis[2],yAxis[2],zAxis[2],0,
        -xAxis[0]*eye[0]-xAxis[1]*eye[1]-xAxis[2]*eye[2],
        -yAxis[0]*eye[0]-yAxis[1]*eye[1]-yAxis[2]*eye[2],
        -zAxis[0]*eye[0]-zAxis[1]*eye[1]-zAxis[2]*eye[2],1
      ]);
    }

    var identity = new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]);

    /*
     * V20 production camera language.
     *
     * The proof of concept used Three.js CatmullRomCurve3.  The production
     * page intentionally keeps its dependency-free WebGL runtime, so these
     * two helpers reproduce the same reversible camera rail and layered
     * mountain instances without adding another renderer to the page.
     */
    function catmullPoint(points, progress) {
      var segmentCount = points.length - 1;
      var scaled = clamp(progress, 0, 1) * segmentCount;
      var segment = Math.min(segmentCount - 1, Math.floor(scaled));
      var t = scaled - segment;
      var p0 = points[Math.max(0, segment - 1)];
      var p1 = points[segment];
      var p2 = points[Math.min(points.length - 1, segment + 1)];
      var p3 = points[Math.min(points.length - 1, segment + 2)];
      var t2 = t * t;
      var t3 = t2 * t;
      var out = [0, 0, 0];
      for (var axis = 0; axis < 3; axis++) {
        out[axis] = .5 * (
          2 * p1[axis] +
          (-p0[axis] + p2[axis]) * t +
          (2 * p0[axis] - 5 * p1[axis] + 4 * p2[axis] - p3[axis]) * t2 +
          (-p0[axis] + 3 * p1[axis] - 3 * p2[axis] + p3[axis]) * t3
        );
      }
      return out;
    }

    function modelMatrix(x, y, z, scale, rotationY) {
      var cosine = Math.cos(rotationY) * scale;
      var sine = Math.sin(rotationY) * scale;
      return new Float32Array([
        cosine,0,-sine,0,
        0,scale,0,0,
        sine,0,cosine,0,
        x,y,z,1
      ]);
    }

    var cameraRail = [
      [5.4, 6.0, 30.5],
      [4.0, 6.3, 23.0],
      [1.5, 6.8, 17.2],
      [-1.0, 7.1, 20.5],
      [-2.8, 7.8, 31.0]
    ];
    var targetRail = [
      [1.15, 1.75, 0],
      [1.0, 2.0, -.4],
      [0, 2.4, -1.9],
      [-1.0, 2.0, -3.0],
      [-.5, 1.7, -4.4]
    ];
    var mountainLayers = [
      modelMatrix(-6.1, -.15, -7.0, .68, .36),
      modelMatrix(0, 0, 0, 1, -.12),
      modelMatrix(7.0, -1.0, 3.1, 1.12, -.44)
    ];

    function resize() {
      var dpr = Math.min(devicePixelRatio || 1, innerWidth < 700 ? 1.35 : 1.75);
      var width = Math.round(innerWidth * dpr);
      var height = Math.round(innerHeight * dpr);
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }
    }

    function render(progress) {
      resize();
      gl.useProgram(program);
      gl.enable(gl.DEPTH_TEST);
      gl.enable(gl.CULL_FACE);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, normalTexture);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, colorTexture);
      gl.uniform1i(normalTextureLocation, 0);
      gl.uniform1i(colorTextureLocation, 1);

      var aspect = canvas.width / canvas.height;
      /* V20 rail, with the production portrait safety offsets retained. */
      var portrait = clamp((.92 - aspect) / .48, 0, 1);
      var phoneFraming = innerWidth < 560 && innerHeight > innerWidth ? 1 : portrait;
      var eye = catmullPoint(cameraRail, progress);
      eye[0] -= portrait * 3.8;
      eye[1] += portrait * .4;
      eye[2] += portrait * 2.7;
      var target = catmullPoint(targetRail, progress);
      target[0] -= portrait * .92;
      target[1] += phoneFraming * 3.15;
      var mobileFov = 42 + portrait * 5;
      var projection = perspective(mobileFov * Math.PI / 180, aspect, .1, 72);
      var view = lookAt(eye, target, [0,1,0]);
      var projectionView = multiply(projection, view);
      gl.uniform3f(eyeLocation, eye[0], eye[1], eye[2]);
      gl.uniform1f(mistLocation, .16);
      for (var layerIndex = 0; layerIndex < mountainLayers.length; layerIndex++) {
        var model = mountainLayers[layerIndex];
        var mvp = multiply(projectionView, model);
        gl.uniformMatrix4fv(mvpLocation, false, mvp);
        gl.uniformMatrix4fv(modelLocation, false, model);
        gl.drawElements(gl.TRIANGLES, drawCount, indexType, 0);
      }
    }

    return { render: render };
  }

  var v20ThreeEnabled = document.documentElement.hasAttribute("data-v20-production") ||
    document.documentElement.hasAttribute("data-v21-production");
  var mountain = v20ThreeEnabled ? null : createMountain();

  /* -----------------------------------------------------------------------
     C-POLAR atmospheric cloud field.

     The scene uses the same visual grammar observed in Mont-Fort's current
     homepage: a quiet high overcast, a moving horizon belt, a foreground
     cloud blind and a central aperture around the hero peak. This is an
     original shader and does not use their textures, model or source code.
     One low-resolution transparent pass supplies continuous organic detail;
     the existing DOM layers remain as inexpensive depth/fallback planes.
     --------------------------------------------------------------------- */
  function createCloudVolume() {
    if (!cloudCanvas) return null;
    var gl = cloudCanvas.getContext("webgl", {
      alpha: true,
      antialias: false,
      premultipliedAlpha: false,
      powerPreference: "high-performance"
    });
    if (!gl) return null;

    var vertexSource = [
      "attribute vec2 aPosition;",
      "void main(){ gl_Position = vec4(aPosition, 0.0, 1.0); }"
    ].join("\n");

    var fragmentSource = [
      "precision highp float;",
      "uniform vec2 uResolution;",
      "uniform vec2 uPointer;",
      "uniform float uTime;",
      "uniform float uProgress;",
      "float hash21(vec2 p){",
      "  p = fract(p * vec2(123.34, 456.21));",
      "  p += dot(p, p + 45.32);",
      "  return fract(p.x * p.y);",
      "}",
      "float valueNoise(vec2 p){",
      "  vec2 i = floor(p);",
      "  vec2 f = fract(p);",
      "  f = f * f * (3.0 - 2.0 * f);",
      "  float a = hash21(i);",
      "  float b = hash21(i + vec2(1.0, 0.0));",
      "  float c = hash21(i + vec2(0.0, 1.0));",
      "  float d = hash21(i + vec2(1.0, 1.0));",
      "  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);",
      "}",
      "float fbm(vec2 p){",
      "  float value = 0.0;",
      "  float amplitude = 0.52;",
      "  mat2 rotation = mat2(0.80, -0.60, 0.60, 0.80);",
      "  for(int octave = 0; octave < 5; octave++) {",
      "    value += valueNoise(p) * amplitude;",
      "    p = rotation * p * 2.03 + vec2(13.7, 7.9);",
      "    amplitude *= 0.49;",
      "  }",
      "  return value;",
      "}",
      "void main(){",
      "  vec2 uv = gl_FragCoord.xy / uResolution;",
      "  float aspect = uResolution.x / max(1.0, uResolution.y);",
      "  vec2 sceneUv = vec2((uv.x - 0.5) * aspect, uv.y);",
      "  float progress = smoothstep(0.0, 1.0, uProgress);",
      "  float time = uTime * 0.018;",
      "  vec2 pointer = (uPointer - 0.5) * vec2(0.035, 0.018);",
      "  vec2 drift = vec2(time + progress * 0.11, -time * 0.18);",
      "  vec2 baseUv = sceneUv * vec2(1.15, 1.50) + drift + pointer;",
      "  vec2 warp = vec2(fbm(baseUv * 1.18), fbm(baseUv * 1.18 + 8.73)) - 0.5;",
      "  float macro = fbm(baseUv * 3.10 + warp * 0.54);",
      "  float detail = fbm(baseUv * 8.20 - warp * 0.20 + vec2(time * 0.30, 0.0));",
      "  float wisps = fbm(vec2(baseUv.x * 3.15, baseUv.y * 7.6) + vec2(-time * 0.38, 2.1));",
      "  float shape = macro * 0.74 + detail * 0.21 + wisps * 0.05;",
      "  float gate = smoothstep(0.20, 0.54, progress) * (1.0 - smoothstep(0.76, 0.99, progress));",
      "  float lowerTop = mix(0.31, 0.49, progress);",
      "  float lower = 1.0 - smoothstep(0.05, lowerTop, uv.y);",
      "  float horizonCenter = mix(0.31, 0.47, progress);",
      "  float horizon = 1.0 - smoothstep(mix(0.075,0.12,progress), mix(0.18,0.28,progress), abs(uv.y - horizonCenter));",
      "  float leftBank = 1.0 - smoothstep(0.12, 0.43, length((uv - vec2(-0.02, mix(0.33,0.46,progress))) * vec2(0.82,1.22)));",
      "  float rightBank = 1.0 - smoothstep(0.16, 0.50, length((uv - vec2(1.03, mix(0.34,0.48,progress))) * vec2(0.78,1.16)));",
      "  float highWisp = smoothstep(0.72, 0.98, uv.y) * smoothstep(0.48, 0.68, wisps) * mix(0.08,0.22,progress);",
      "  float lobeNoise = smoothstep(0.42, 0.54, shape);",
      "  float baseFog = lower * (0.07 + smoothstep(0.42, 0.55, shape) * 0.89);",
      "  float ribbon = horizon * smoothstep(0.40,0.54,macro*.70 + detail*.30) * mix(.62,.86,gate);",
      "  float sideFog = max(leftBank, rightBank) * lobeNoise * mix(.30,.62,gate);",
      "  float density = max(baseFog, max(ribbon, sideFog));",
      "  density = max(density, highWisp);",
      "  float peakDistance = length((uv - vec2(0.625, mix(0.64,0.68,progress))) * vec2(1.18,0.92));",
      "  float peakAperture = smoothstep(mix(0.10,0.18,gate), mix(0.27,0.38,gate), peakDistance);",
      "  float peakZone = smoothstep(0.43, 0.64, uv.y);",
      "  density *= mix(1.0, mix(mix(0.14,0.34,gate), 1.0, peakAperture), peakZone);",
      "  float copyX = 1.0 - smoothstep(0.38,0.54,uv.x);",
      "  float copyY = smoothstep(0.18,0.33,uv.y) * (1.0 - smoothstep(0.76,0.88,uv.y));",
      "  float copySafe = copyX * copyY * (1.0 - gate * 0.45);",
      "  density *= mix(1.0, 0.22, copySafe);",
      "  float transitionBlind = gate * horizon * (0.08 + smoothstep(0.39,0.64,detail) * 0.34);",
      "  density = max(density, transitionBlind * mix(0.30,1.0,peakAperture));",
      "  float shiftedMacro = fbm((baseUv + vec2(-0.034, 0.046)) * 3.10 + warp * 0.54);",
      "  float lightShape = clamp((macro - shiftedMacro) * 6.2 + 0.52, 0.0, 1.0);",
      "  float edge = smoothstep(0.36, 0.60, shape);",
      "  float billowRim = smoothstep(0.31, 0.44, shape) * (1.0 - smoothstep(0.48, 0.63, shape));",
      "  vec3 shadow = vec3(0.962, 0.978, 0.989);",
      "  vec3 light = vec3(0.992, 0.997, 1.0);",
      "  vec3 color = mix(shadow, light, clamp(.52 + lightShape * .34 + edge * .10 + uv.y * .03, 0.0, 1.0));",
      "  color = mix(color, vec3(0.91, 0.956, 0.982), billowRim * 0.18);",
      "  color += vec3(0.010, 0.016, 0.021) * detail * edge * 0.08;",
      "  float alpha = clamp(density * mix(0.66, 0.84, max(progress, gate)), 0.0, 0.76);",
      "  alpha *= smoothstep(0.0, 0.055, uv.x) * smoothstep(1.0, 0.945, uv.x);",
      "  gl_FragColor = vec4(color, alpha);",
      "}"
    ].join("\n");

    function compile(type, source) {
      var item = gl.createShader(type);
      gl.shaderSource(item, source);
      gl.compileShader(item);
      if (!gl.getShaderParameter(item, gl.COMPILE_STATUS)) {
        console.warn("C-POLAR cloud shader:", gl.getShaderInfoLog(item));
        gl.deleteShader(item);
        return null;
      }
      return item;
    }

    var vertexShader = compile(gl.VERTEX_SHADER, vertexSource);
    var fragmentShader = compile(gl.FRAGMENT_SHADER, fragmentSource);
    if (!vertexShader || !fragmentShader) return null;
    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
    gl.useProgram(program);

    var triangle = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, triangle);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);
    var positionLocation = gl.getAttribLocation(program, "aPosition");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    var resolutionLocation = gl.getUniformLocation(program, "uResolution");
    var pointerLocation = gl.getUniformLocation(program, "uPointer");
    var timeLocation = gl.getUniformLocation(program, "uTime");
    var progressLocation = gl.getUniformLocation(program, "uProgress");
    var pointerTarget = [.5, .5];
    var pointerCurrent = [.5, .5];

    function resize() {
      /* Clouds are intentionally rendered below device DPR: their softness is
         volumetric, while the mountain retains the high-resolution canvas. */
      var scale = innerWidth < 700 ? .64 : .82;
      var width = Math.max(2, Math.round(innerWidth * scale));
      var height = Math.max(2, Math.round(innerHeight * scale));
      if (cloudCanvas.width !== width || cloudCanvas.height !== height) {
        cloudCanvas.width = width;
        cloudCanvas.height = height;
        gl.viewport(0, 0, width, height);
      }
    }

    function render(progress, time) {
      resize();
      pointerCurrent[0] += (pointerTarget[0] - pointerCurrent[0]) * .035;
      pointerCurrent[1] += (pointerTarget[1] - pointerCurrent[1]) * .035;
      gl.useProgram(program);
      gl.disable(gl.DEPTH_TEST);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(resolutionLocation, cloudCanvas.width, cloudCanvas.height);
      gl.uniform2f(pointerLocation, pointerCurrent[0], pointerCurrent[1]);
      gl.uniform1f(timeLocation, reduced ? 0 : (time || 0) * .001);
      gl.uniform1f(progressLocation, progress || 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    if (!reduced) {
      addEventListener("pointermove", function (event) {
        pointerTarget[0] = event.clientX / Math.max(1, innerWidth);
        pointerTarget[1] = 1 - event.clientY / Math.max(1, innerHeight);
      }, { passive: true });
    }
    document.documentElement.classList.add("cp-cloud-volume-ready");
    return { render: render };
  }

  var cloudVolume = createCloudVolume();

  /* -----------------------------------------------------------------------
     Dust exists only after the clean mountain hero, matching the story.
     --------------------------------------------------------------------- */
  var dustContext = dustCanvas.getContext("2d");
  var dust = [];
  var dustWidth = 0, dustHeight = 0;
  var dustDensityMultiplier = 1;

  function resizeDust() {
    var dpr = Math.min(devicePixelRatio || 1, 1.5);
    dustWidth = innerWidth;
    dustHeight = innerHeight;
    dustCanvas.width = Math.round(dustWidth * dpr);
    dustCanvas.height = Math.round(dustHeight * dpr);
    dustCanvas.style.width = dustWidth + "px";
    dustCanvas.style.height = dustHeight + "px";
    dustContext.setTransform(dpr, 0, 0, dpr, 0, 0);
    /* Keep the complete pollutant field allocated once. This is three times
       denser than the previous maximum population, while remaining cheap on
       the 2D overlay (378 particles on mobile, 684 on desktop). */
    var count = (innerWidth < 700 ? 42 : 76) * 9;
    dust = Array.from({ length: count }, function (_, index) {
      return {
        x: (index * 97.3 % 100) / 100 * dustWidth,
        y: (index * 53.7 % 100) / 100 * dustHeight,
        r: .7 + (index % 6) * .32,
        orbitX: 2.5 + (index % 11) * .72,
        orbitY: 1.8 + (index % 7) * .58,
        phase: index * 1.61803398875,
        speed: .00012 + (index % 9) * .000013
      };
    });
  }

  function drawDust(time, opacity, densityMultiplier) {
    dustContext.clearRect(0, 0, dustWidth, dustHeight);
    if (opacity <= .002) return;
    var activeCount = Math.ceil(dust.length * clamp(densityMultiplier || 1, 0, 1));
    dustContext.fillStyle = "rgba(20,42,56," + (.18 * opacity).toFixed(3) + ")";
    dust.forEach(function (particle, index) {
      if (index >= activeCount) return;
      var orbit = time * particle.speed + particle.phase;
      var x = particle.x + Math.sin(orbit) * particle.orbitX;
      var y = particle.y + Math.cos(orbit * .83) * particle.orbitY;
      dustContext.beginPath();
      dustContext.arc(x, y, particle.r, 0, Math.PI * 2);
      dustContext.fill();
    });
  }

  /* Pollutant specimen controls. */
  var labels = {
    ultrafine: "Ultrafine particle",
    smoke: "Wildfire smoke",
    virus: "Virus",
    bacteria: "Bacteria",
    spore: "Fungal spore",
    pm25: "PM 2.5",
    pollen: "Pollen",
    chromium: "Chromium-6",
    pfas: "PFAS"
  };
  var specimenButtons = Array.prototype.slice.call(document.querySelectorAll(".cp-tackle-row li"));
  var specimenImages = Array.prototype.slice.call(document.querySelectorAll(".cp-scope-img"));
  var specimenName = document.getElementById("cp-scope-name");
  var currentSpecimen = "ultrafine";
  var specimenOrder = specimenButtons.map(function (item) { return item.dataset.k; });
  var specimenIndex = Math.max(0, specimenOrder.indexOf(currentSpecimen));
  var specimenTimer = 0;
  var specimenResumeTimer = 0;
  var specimenInView = false;
  var specimenPaused = false;
  var specimenInterval = 2500;

  function setSpecimen(key) {
    if (!labels[key]) return;
    currentSpecimen = key;
    specimenIndex = Math.max(0, specimenOrder.indexOf(key));
    specimenImages.forEach(function (image) {
      image.classList.toggle("is-on", image.dataset.k === key);
    });
    specimenButtons.forEach(function (item) {
      item.classList.toggle("is-active", item.dataset.k === key);
    });
    specimenName.textContent = labels[key];
  }

  function stopSpecimenAutoplay() {
    if (!specimenTimer) return;
    clearInterval(specimenTimer);
    specimenTimer = 0;
  }

  function startSpecimenAutoplay() {
    if (reduced || specimenTimer || specimenPaused || !specimenInView || specimenOrder.length < 2) return;
    specimenTimer = window.setInterval(function () {
      if (document.hidden || specimenPaused || !specimenInView) return;
      specimenIndex = (specimenIndex + 1) % specimenOrder.length;
      setSpecimen(specimenOrder[specimenIndex]);
    }, specimenInterval);
  }

  function pauseSpecimenAutoplay() {
    specimenPaused = true;
    clearTimeout(specimenResumeTimer);
    specimenResumeTimer = 0;
    stopSpecimenAutoplay();
  }

  function resumeSpecimenAutoplay(delay) {
    clearTimeout(specimenResumeTimer);
    specimenResumeTimer = window.setTimeout(function () {
      specimenPaused = false;
      startSpecimenAutoplay();
    }, delay || 0);
  }

  specimenButtons.forEach(function (item) {
    var link = item.querySelector("a");
    if (!link) return;
    link.addEventListener("pointerenter", function () {
      pauseSpecimenAutoplay();
      setSpecimen(item.dataset.k);
    });
    link.addEventListener("pointerleave", function () { resumeSpecimenAutoplay(500); });
    link.addEventListener("focus", function () {
      pauseSpecimenAutoplay();
      setSpecimen(item.dataset.k);
    });
    link.addEventListener("blur", function () { resumeSpecimenAutoplay(500); });
    link.addEventListener("click", function () {
      setSpecimen(item.dataset.k);
      pauseSpecimenAutoplay();
      resumeSpecimenAutoplay(5000);
    });
  });
  setSpecimen(currentSpecimen);

  if ("IntersectionObserver" in window) {
    var specimenObserver = new IntersectionObserver(function (entries) {
      specimenInView = entries.some(function (entry) {
        return entry.isIntersecting && entry.intersectionRatio >= .28;
      });
      if (specimenInView) startSpecimenAutoplay();
      else stopSpecimenAutoplay();
    }, { threshold: [0, .28, .55] });
    specimenObserver.observe(pollutants);
  } else {
    specimenInView = true;
    startSpecimenAutoplay();
  }

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) stopSpecimenAutoplay();
    else startSpecimenAutoplay();
  });

  var targetScrollY = window.scrollY || 0;
  var visualScrollY = targetScrollY;
  var lastMotionTime = performance.now();
  var currentCloudProgress = 0;
  var lastCloudFrame = 0;
  var lastMountainReady = false;
  var journeyFilmDuration = 7.708;
  var lastJourneyFilmTime = -1;

  if (journeyFilm && !(window.CPolarV21Journey && window.CPolarV21Journey.active)) {
    var journeyFilmStarted = false;
    function loadJourneyFilm() {
      if (journeyFilmStarted) return;
      journeyFilmStarted = true;
      var journeyFilmSrc = innerWidth < 700 ?
        journeyFilm.dataset.mobileSrc : journeyFilm.dataset.desktopSrc;
      journeyFilm.src = journeyFilmSrc;
      journeyFilm.addEventListener("loadedmetadata", function () {
        if (isFinite(journeyFilm.duration) && journeyFilm.duration > 0) {
          journeyFilmDuration = journeyFilm.duration;
        }
      }, { once: true });
      journeyFilm.load();
    }

    /* Keep the 3–8 MB scroll film out of the critical Hero request chain.
       Start it on the first sign of scroll intent, with an idle fallback so
       the authored cloud transition is ready before most users reach About. */
    ["wheel", "touchstart", "pointerdown", "keydown"].forEach(function (eventName) {
      window.addEventListener(eventName, loadJourneyFilm, { once: true, passive: true });
    });
    // The transition begins only after the Hero, so do not spend another
    // 3–8 MB while a visitor is still reading the first screen. A first wheel,
    // touch or keyboard gesture gives the browser useful lead time before the
    // authored cloud sequence is visible.
    if (window.scrollY > 2) loadJourneyFilm();
  }

  function isMountainReady() {
    if (v20ThreeEnabled) {
      if (document.documentElement.hasAttribute("data-v21-production")) {
        return Boolean(window.CPolarV21Journey && window.CPolarV21Journey.ready);
      }
      return Boolean(window.CPolarV20Hero && window.CPolarV20Hero.ready);
    }
    return document.documentElement.classList.contains("cp-mountain-glb-ready") &&
      document.documentElement.classList.contains("cp-mountain-color-ready") &&
      document.documentElement.classList.contains("cp-mountain-normal-ready");
  }

  function measureAndRender(time) {
    var frameScroll = visualScrollY;
    var viewport = innerHeight || 1;
    var aboutTop = about.offsetTop;
    var pollutantTop = pollutants.offsetTop;
    var aboutProgress = clamp((frameScroll - aboutTop + viewport * .35) / Math.max(viewport, about.offsetHeight - viewport * .4), 0, 1);
    var aboutLocal = clamp((frameScroll - aboutTop + viewport * .12) / Math.max(1, about.offsetHeight - viewport * .20), 0, 1);
    /* Authored film replaces the old CSS white core. It starts while the Hero
       mountain is still visible, reaches a complete clean cloud sea at the
       first About line, then grades into pollution before revealing the city. */
    var aboutTravel = Math.max(viewport, about.offsetHeight - viewport * .20);
    /*
     * V20 owns the complete Hero scroll.  The earlier production mapping
     * started the cloud film almost one viewport before About, which covered
     * the mountain rail before its push-through / pull-back could be seen.
     * Begin the authored film only at the Hero→About boundary.
     */
    var journeyFilmStart = aboutTop - viewport * .035;
    var journeyFilmEnd = aboutTop + aboutTravel * .85;
    var journeyFilmProgress = clamp((frameScroll - journeyFilmStart) /
      Math.max(1, journeyFilmEnd - journeyFilmStart), 0, 1);
    var journeyFilmIn = smoothstep(journeyFilmProgress / .18);
    var mountainCityGate = pulse(aboutLocal, .31, .47, .58);
    var cityTowerGate = pulse(aboutLocal, .56, .67, .76);
    var towerInteriorGate = pulse(aboutLocal, .76, .86, .95);
    var cityIn = smoothstep((aboutLocal - .445) / .04);
    var cityOut = smoothstep((aboutLocal - .645) / .045);
    var towerIn = smoothstep((aboutLocal - .645) / .045);
    var towerOut = smoothstep((aboutLocal - .835) / .045);
    var interiorIn = smoothstep((aboutLocal - .835) / .045);
    var cleanCloudGate = smoothstep((journeyFilmProgress - .10) / .22) *
      (1 - smoothstep((journeyFilmProgress - .62) / .18));
    var flareIn = smoothstep((aboutLocal - .82) / .065);
    var flareOut = 1 - smoothstep((aboutLocal - .90) / .075);
    var flare = flareIn * flareOut;
    /* Reveal the issue statement with the first city plate, then hold it
       through the tower push and most of the interior approach. Keeping the
       copy in a long, stable window makes it readable instead of treating it
       like another quick transition title. */
    var dirtyCopyIn = smoothstep((aboutLocal - .435) / .055);
    var dirtyCopyOut = 1 - smoothstep((aboutLocal - .90) / .075);
    var pollutantContentIn = smoothstep((frameScroll - pollutantTop + viewport * .16) / (viewport * .22));
    dustDensityMultiplier = pollutantContentIn;
    var journeyFilmOut = 1 - smoothstep((aboutLocal - .60) / .09);
    var journeyFilmOpacity = journeyFilmIn * journeyFilmOut;
    var journeyOpacity = Math.max(journeyFilmOpacity, cityIn * (1 - cityOut), towerIn * (1 - towerOut), interiorIn);
    var worldExit = smoothstep((journeyFilmProgress - .035) / .22);
    var mountainProgress = smoothstep(clamp(frameScroll / Math.max(1, aboutTop - viewport * .035), 0, 1));
    /* The particles now belong to the pollutant chapter itself: fade them in
       as the section reaches the viewport, keep them suspended for the full
       sticky sequence, then release them only as the chapter exits. */
    var pollutantEnd = pollutantTop + pollutants.offsetHeight;
    var dustIn = smoothstep((frameScroll - pollutantTop + viewport * .72) / (viewport * .52));
    var dustOut = 1 - smoothstep((frameScroll - pollutantEnd + viewport * 1.18) / (viewport * .58));
    var dustOpacity = dustIn * dustOut;
    var answerProgress = smoothstep((frameScroll - pollutantTop - viewport * .38) / (viewport * .6));

    // V21 owns the Hero -> clean cloud -> pollution cloud -> city journey.
    // Keep this legacy runtime responsible only for the pollutant section UI
    // so two scroll systems never write competing transforms in the same frame.
    if (window.CPolarV21Journey && window.CPolarV21Journey.active) {
      document.documentElement.style.setProperty("--pollutant-content-opacity", pollutantContentIn.toFixed(4));
      document.documentElement.style.setProperty("--pollutant-content-y", ((1 - pollutantContentIn) * 28).toFixed(2) + "px");
      document.documentElement.style.setProperty("--dust-opacity", dustOpacity.toFixed(4));
      document.documentElement.style.setProperty("--answer-opacity", answerProgress.toFixed(4));
      return;
    }
    currentCloudProgress = mountainProgress;

    document.documentElement.style.setProperty("--world-opacity", (1 - worldExit).toFixed(4));
    document.documentElement.style.setProperty("--journey-opacity", journeyOpacity.toFixed(4));
    document.documentElement.style.setProperty("--journey-visibility", journeyOpacity > .002 ? "visible" : "hidden");
    document.documentElement.style.setProperty("--journey-film-opacity", journeyFilmOpacity.toFixed(4));
    document.documentElement.style.setProperty("--journey-city-opacity", (cityIn * (1 - cityOut)).toFixed(4));
    document.documentElement.style.setProperty("--journey-tower-opacity", (towerIn * (1 - towerOut)).toFixed(4));
    document.documentElement.style.setProperty("--journey-interior-opacity", interiorIn.toFixed(4));
    document.documentElement.style.setProperty("--journey-flare-opacity", flare.toFixed(4));
    document.documentElement.style.setProperty("--journey-flare-x", ((aboutLocal - .82) * 390 - 38).toFixed(2) + "%");
    document.documentElement.style.setProperty("--journey-city-scale", (1.04 + smoothstep((aboutLocal - .46) / .30) * .22).toFixed(4));
    document.documentElement.style.setProperty("--journey-city-y", (-smoothstep((aboutLocal - .46) / .28) * 3.2).toFixed(3) + "vh");
    document.documentElement.style.setProperty("--journey-city-blur", (cityOut * 5).toFixed(2) + "px");
    document.documentElement.style.setProperty("--journey-tower-scale", (1.02 + smoothstep((aboutLocal - .62) / .30) * .42).toFixed(4));
    document.documentElement.style.setProperty("--journey-tower-x", (-smoothstep((aboutLocal - .62) / .30) * 3.2).toFixed(3) + "vw");
    document.documentElement.style.setProperty("--journey-tower-blur", (towerOut * 7).toFixed(2) + "px");
    document.documentElement.style.setProperty("--journey-interior-scale", (1.055 - interiorIn * .055).toFixed(4));
    document.documentElement.style.setProperty("--journey-interior-x", ((1 - interiorIn) * 2.5).toFixed(3) + "vw");
    document.documentElement.style.setProperty("--journey-interior-blur", ((1 - interiorIn) * 7).toFixed(2) + "px");
    document.documentElement.style.setProperty("--clean-copy-opacity", (1 - smoothstep((aboutLocal - .35) / .15)).toFixed(4));
    document.documentElement.style.setProperty("--clean-copy-y", (-smoothstep((aboutLocal - .35) / .15) * 24).toFixed(2) + "px");
    document.documentElement.style.setProperty("--dirty-copy-opacity", (dirtyCopyIn * dirtyCopyOut).toFixed(4));
    document.documentElement.style.setProperty("--dirty-copy-y", ((1 - dirtyCopyIn) * 22 - (1 - dirtyCopyOut) * 16).toFixed(2) + "px");
    document.documentElement.style.setProperty("--pollutant-content-opacity", pollutantContentIn.toFixed(4));
    document.documentElement.style.setProperty("--pollutant-content-y", ((1 - pollutantContentIn) * 28).toFixed(2) + "px");
    /* The authored GLB is the mountain at every scroll position, including
       the Hero first frame. The WebP is strictly a loading/error fallback.
       Requiring both surface maps avoids briefly exposing an untextured mesh. */
    var mountainReady = isMountainReady();
    document.documentElement.style.setProperty("--beauty-opacity", mountainReady ? "0" : "1");
    document.documentElement.style.setProperty("--webgl-mountain-opacity", mountainReady ? "1" : "0");
    /* Camera motion already supplies the push-in. A second CSS zoom/translation
       changed the silhouette and made the scroll frames look like another
       mountain, so keep the rendered canvas spatially locked. */
    document.documentElement.style.setProperty("--mountain-scale", "1");
    document.documentElement.style.setProperty("--mountain-x", "0vw");
    document.documentElement.style.setProperty("--mountain-y", "0vh");
    document.documentElement.style.setProperty("--cloud-far-x", (mountainProgress * -14).toFixed(2));
    document.documentElement.style.setProperty("--cloud-mid-x", (mountainProgress * 20).toFixed(2));
    document.documentElement.style.setProperty("--cloud-near-x", (mountainProgress * 28).toFixed(2));
    document.documentElement.style.setProperty("--cloud-far-y", (-mountainProgress * 5).toFixed(2) + "vh");
    document.documentElement.style.setProperty("--cloud-mid-y", (-mountainProgress * 10).toFixed(2) + "vh");
    document.documentElement.style.setProperty("--cloud-near-y", (-mountainProgress * 8).toFixed(2) + "vh");
    document.documentElement.style.setProperty("--cloud-volume-opacity", (1 - worldExit * .7).toFixed(3));
    document.documentElement.style.setProperty("--cloud-mid-opacity", (.32 + mountainProgress * .12 + cleanCloudGate * .36).toFixed(3));
    document.documentElement.style.setProperty("--cloud-near-opacity", (.34 + mountainProgress * .12 + cleanCloudGate * .48).toFixed(3));
    document.documentElement.style.setProperty("--dust-opacity", dustOpacity.toFixed(4));
    document.documentElement.style.setProperty("--answer-opacity", answerProgress.toFixed(4));

    if (journeyFilm && journeyFilm.readyState >= 1) {
      var filmProgress = reduced ?
        (journeyFilmProgress < .34 ? 0 : journeyFilmProgress < .68 ? .50 : 1) :
        journeyFilmProgress;
      var desiredFilmTime = clamp(filmProgress * Math.max(.01, journeyFilmDuration - .04), 0, journeyFilmDuration - .02);
      if (Math.abs(desiredFilmTime - lastJourneyFilmTime) > (1 / 30)) {
        journeyFilm.currentTime = desiredFilmTime;
        lastJourneyFilmTime = desiredFilmTime;
      }
    }

    if (v20ThreeEnabled && window.CPolarV20Hero) {
      window.CPolarV20Hero.setProgress(reduced ? 0 : mountainProgress);
    } else if (mountain) {
      mountain.render(reduced ? 0 : mountainProgress);
    }
    if (!v20ThreeEnabled && cloudVolume) {
      cloudVolume.render(reduced ? .42 : mountainProgress, time || performance.now());
    }
    drawDust(time || performance.now(), dustOpacity, dustDensityMultiplier);

  }

  function onScroll() {
    targetScrollY = window.scrollY || 0;
  }

  function animate(time) {
    if (!document.hidden) {
      var delta = Math.min(.05, Math.max(0, (time - lastMotionTime) / 1000));
      lastMotionTime = time;
      var previousVisualScroll = visualScrollY;
      visualScrollY = reduced ? targetScrollY :
        visualScrollY + (targetScrollY - visualScrollY) * (1 - Math.exp(-delta * 11.5));
      if (Math.abs(targetScrollY - visualScrollY) < .025) visualScrollY = targetScrollY;
      var cameraMoved = Math.abs(previousVisualScroll - visualScrollY) > .002;
      var mountainReady = isMountainReady();
      var mountainAssetsChanged = mountainReady !== lastMountainReady;

      if (cameraMoved || mountainAssetsChanged) {
        measureAndRender(time);
        lastCloudFrame = time;
        lastMountainReady = mountainReady;
      } else if (!reduced && cloudVolume && time - lastCloudFrame > 32) {
        cloudVolume.render(currentCloudProgress, time);
        lastCloudFrame = time;
      }
      var dustOpacity = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--dust-opacity")) || 0;
      if (!reduced && dustOpacity > .002) drawDust(time, dustOpacity, dustDensityMultiplier);
    }
    requestAnimationFrame(animate);
  }

  resizeDust();
  addEventListener("resize", function () {
    resizeDust();
    onScroll();
  }, { passive: true });
  addEventListener("scroll", onScroll, { passive: true });
  targetScrollY = window.scrollY || 0;
  visualScrollY = targetScrollY;
  measureAndRender(performance.now());
  requestAnimationFrame(animate);
})();
