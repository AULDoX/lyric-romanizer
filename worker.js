importScripts("https://cdn.jsdelivr.net/npm/kuromoji@0.1.2/build/kuromoji.js");

let tokenizer = null;

function isControlLine(line) {
  return /^\s*\[[^\]]+\]\s*$/.test(line) || /^\s*\([^\)]+\)\s*$/.test(line);
}

function kanaToRomaji(value) {
  const combo = {
    "キャ":"kya","キュ":"kyu","キョ":"kyo","シャ":"sha","シュ":"shu","ショ":"sho","チャ":"cha","チュ":"chu","チョ":"cho",
    "ニャ":"nya","ニュ":"nyu","ニョ":"nyo","ヒャ":"hya","ヒュ":"hyu","ヒョ":"hyo","ミャ":"mya","ミュ":"myu","ミョ":"myo",
    "リャ":"rya","リュ":"ryu","リョ":"ryo","ギャ":"gya","ギュ":"gyu","ギョ":"gyo","ジャ":"ja","ジュ":"ju","ジョ":"jo",
    "ビャ":"bya","ビュ":"byu","ビョ":"byo","ピャ":"pya","ピュ":"pyu","ピョ":"pyo","ファ":"fa","フィ":"fi","フェ":"fe","フォ":"fo"
  };
  const single = {
    "ア":"a","イ":"i","ウ":"u","エ":"e","オ":"o","カ":"ka","キ":"ki","ク":"ku","ケ":"ke","コ":"ko","サ":"sa","シ":"shi","ス":"su","セ":"se","ソ":"so",
    "タ":"ta","チ":"chi","ツ":"tsu","テ":"te","ト":"to","ナ":"na","ニ":"ni","ヌ":"nu","ネ":"ne","ノ":"no","ハ":"ha","ヒ":"hi","フ":"fu","ヘ":"he","ホ":"ho",
    "マ":"ma","ミ":"mi","ム":"mu","メ":"me","モ":"mo","ヤ":"ya","ユ":"yu","ヨ":"yo","ラ":"ra","リ":"ri","ル":"ru","レ":"re","ロ":"ro","ワ":"wa","ヲ":"wo","ン":"n",
    "ガ":"ga","ギ":"gi","グ":"gu","ゲ":"ge","ゴ":"go","ザ":"za","ジ":"ji","ズ":"zu","ゼ":"ze","ゾ":"zo","ダ":"da","ヂ":"ji","ヅ":"zu","デ":"de","ド":"do",
    "バ":"ba","ビ":"bi","ブ":"bu","ベ":"be","ボ":"bo","パ":"pa","ピ":"pi","プ":"pu","ペ":"pe","ポ":"po","ァ":"a","ィ":"i","ゥ":"u","ェ":"e","ォ":"o","ャ":"ya","ュ":"yu","ョ":"yo","ッ":"","ー":"-"
  };
  const s = String(value || "");
  let out = "";
  for (let i = 0; i < s.length; i++) {
    if (s[i] === "ッ" && i + 1 < s.length) {
      const next = combo[s.slice(i + 1, i + 3)] || single[s[i + 1]] || "";
      if (next) { out += next[0]; continue; }
    }
    const two = s.slice(i, i + 2);
    if (combo[two]) { out += combo[two]; i++; continue; }
    out += single[s[i]] !== undefined ? single[s[i]] : s[i];
  }
  return out;
}

function convertLine(line) {
  if (isControlLine(line) || !line.trim()) return line;
  const tokens = tokenizer.tokenize(line);
  return tokens.map(token => {
    if (token.pos === "助詞") {
      if (token.surface_form === "は") return "wa";
      if (token.surface_form === "へ") return "e";
      if (token.surface_form === "を") return "o";
    }
    return kanaToRomaji(token.reading || token.surface_form);
  }).join(" ").replace(/\s+([、。,.!?！？])/g, "$1");
}

try {
  kuromoji.builder({ dicPath: "https://cdn.jsdelivr.net/npm/kuromoji@0.1.2/dict/" }).build((error, builtTokenizer) => {
    if (error) {
      postMessage({ type: "error", message: error.message || String(error) });
      return;
    }
    tokenizer = builtTokenizer;
    postMessage({ type: "ready" });
  });
} catch (error) {
  postMessage({ type: "error", message: error.message || String(error) });
}

onmessage = event => {
  try {
    const data = event.data || {};
    if (data.type !== "convert") return;
    if (!tokenizer) {
      postMessage({ type: "error", message: "tokenizer is not ready" });
      return;
    }
    const result = String(data.text || "").split(/\r?\n/).map(convertLine).join("\n");
    postMessage({ type: "result", result });
  } catch (error) {
    postMessage({ type: "error", message: error.message || String(error) });
  }
};
