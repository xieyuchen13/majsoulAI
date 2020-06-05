function hex2bin(str) {
    var ret = '';
    var tmp = '';
    for (var i = 0; i < str.length - 1; i += 2) {
        var c = String.fromCharCode(parseInt(str.substr(i, 2), 16));
        if (c.charCodeAt() > 127) {
            tmp += '%' + str.substr(i, 2);
            if (tmp.length == 9) {
                ret += decodeURIComponent(tmp);
                tmp = '';
            }
        } else {
            ret += c;
        }
    }
    return ret;
}
function bin2hex(str) {
    var ret = '';
    var r = /[0-9a-zA-Z_.~!*()]/;
    for (var i = 0, l = str.length; i < l; i++) {
        if (r.test(str.charAt(i))) {
            ret += str.charCodeAt(i).toString(16);
        } else {
            ret += encodeURIComponent(str.charAt(i)).replace(/%/g, '');
        }
    }
    return ret;
}

var ws = new WebSocket("wss://gateway-v2.majsoul.com:5201/");
ws.onopen = function() {
    console.log("连接建立。");
};
ws.onclose = function() {
    console.log("连接关闭。")
};

function send_message(ws, msg) {
    ws.send(msg);
}

function receive_message(ws) {
    return new Promise((resolve) => {
        ws.onmessage = function(e) {
            resolve(e.data);
        };
    });
}

function hex2array(hex_string) {
    return new Uint8Array(hex_string.match(/[\da-f]{2}/gi).map(function (h) {
        return parseInt(h, 16)
    })).buffer;
}

function login() {
    hex_text = "0202000a152e6c712e4c6f6262792e6f61757468324c6f67696e126c0803122437363862363662652d373832392d346333372d613865312d3862393862366163666565361800220c0a02706322067361666172692a2437353937663838362d653138662d343864642d616635362d6561373265373664356363303209302e362e3236392e77420102"
    buffer = hex2array(hex_text);
    send_message(ws, buffer);
}

async function get_paipu(uid) {
    hex_text = "0221000a192e6c712e4c6f6262792e666574636847616d655265636f7264122d0a2b" + bin2hex(uid);
    hex_text = hex_text.replace(new RegExp(/(\-)/g),'2d')
    buffer = hex2array(hex_text);
    send_message(ws, buffer);
    result = await receive_message(ws);
    return result;
}


function sleep (time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

await sleep(500);
paipu_id = "200605-211ffb8e-16ff-4d1a-a4be-c0aaac794896"
login();
await get_paipu(paipu_id);