define(function(require, exports, module) {
  var traceur = require('traceur');

  function prepend(a, b) {
    for (var p in b)
      if (!(p in a))
        a[p] = b[p];
    return a;
  }

  exports.translate = function(load) {
    var options = {
      // modules: this.builder ? 'parse' : 'instantiate', // pending https://github.com/google/traceur-compiler/pull/2010
      modules: 'instantiate',
      script: false,
      sourceMaps: this.builder ? 'memory' : 'inline',
      filename: load.address,
      inputSourceMap: load.metadata.sourceMap,
      moduleName: false
    };

    if (load.metadata.traceurOptions)
      prepend(options, load.metadata.traceurOptions);

    if (this.traceurOptions)
      prepend(options, this.traceurOptions);

    var compiler = new traceur.Compiler(options);

    if (!load.metadata.format)
      load.metadata.format = 'register';

    var transpiledSource = doTraceurCompile(load.source, compiler, options.filename);

    if (this.builder && transpiledSource.match(/\$traceurRuntime/))
      load.metadata.deps.push('traceur-runtime');

    if (this.builder) {
      load.metadata.sourceMap = compiler.getSourceMap();
      load.metadata.format = 'esm';
      return transpiledSource;
    }
    else {
      return '(function(__moduleName){' + transpiledSource + '\n})("' + load.name + '");\n//# sourceURL=' + load.address + '!transpiled';
    }
  };

  function doTraceurCompile(source, compiler, filename) {
    try {
      return compiler.compile(source, filename);
    }
    catch(e) {
      // traceur throws an error array (pending 0.0.93)
      throw e[0];
    }
  }
});