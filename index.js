"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const admin = require("firebase-admin");
const bodyParser = require("body-parser");
const mjpage = require("mathjax-node-page");
const pug = require("pug");
const path = require("path");
let serviceAccount = process.env.SERVICEACCOUNT[0] == "{" ?
    JSON.parse(process.env.SERVICEACCOUNT) :
    process.env.SERVICEACCOUNT;
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://mat-ms.firebaseio.com"
});
const db = admin.firestore();
db.settings({
    timestampsInSnapshots: true
});
// Sunucu
function belgeUyarla(belge) {
    return __awaiter(this, void 0, void 0, function* () {
        return Object.assign({}, belge.data(), { id: belge.ref.id, yanitlar: yield belge.ref.collection("Yanıtlar")
                .orderBy("Zaman", "desc")
                .get()
                .then(yanitlarOku) });
        function yanitlarOku(snapshot) {
            return snapshot.docs.map(doc => doc.data());
        }
    });
}
let sorular;
db.collection("Sorular").orderBy("Zaman", "desc").onSnapshot((snapshot) => __awaiter(this, void 0, void 0, function* () {
    sorular = yield Promise.all(snapshot.docs.map(belgeUyarla));
}));
const app = express();
const sunucu = app.listen(process.env.PORT);
app.use(express.static('wwwroot'));
app.use(bodyParser.urlencoded({ extended: true }));
app.set('views', './views');
app.set('view engine', 'pug');
let s = path.sep;
let indexTemplate = pug.compileFile(__dirname + `${s}views${s}index.pug`, { cache: true });
let sorularTemplate = pug.compileFile(__dirname + `${s}views${s}sorular.pug`);
let soruTemplate = pug.compileFile(__dirname + `${s}views${s}soru.pug`);
app.get("/", (req, res) => {
    let compiled = indexTemplate({});
    mjpage.mjpage(compiled, { format: ["AsciiMath"], output: "html" }, {}, mjrendered => {
        res.send(mjrendered);
    });
});
app.get("/sorular", (req, res) => {
    if (!sorular)
        return res.send("");
    let compiled = sorularTemplate({ sorular: sorular });
    mjpage.mjpage(compiled, { format: ["AsciiMath"], output: "html", cssInline: false }, { linebreaks: true }, mjrendered => {
        res.send(mjrendered);
    });
});
app.get("/soru", (req, res) => {
    db.collection("Sorular")
        .doc(req.query.id).get().then((snapshot) => __awaiter(this, void 0, void 0, function* () {
        if (!snapshot.data)
            return res.status(404);
        let rendered = soruTemplate({ soru: yield belgeUyarla(snapshot) });
        mjpage.mjpage(rendered, { format: ["AsciiMath"], output: "html" }, {}, sonuç => res.send(sonuç));
    }));
});
app.post("/soru", (req, res) => {
    if (!req.body ||
        typeof req.body["Yazan"] !== "string" ||
        typeof req.body["İçerik"] !== "string") {
        return res.send(400 /*Bad Request*/);
    }
    db.collection("Sorular").add({
        "Yazan": req.body["Yazan"],
        "İçerik": req.body["İçerik"],
        "Zaman": admin.firestore.Timestamp.now()
    });
    res.status(200);
    res.redirect("back");
});
app.post("/yanitla", (req, res) => {
    if (!req.query.id ||
        typeof req.body["Yazan"] !== "string" ||
        typeof req.body["İçerik"] !== "string") {
        return res.status(400);
    }
    db.collection("Sorular")
        .doc(req.query.id)
        .collection("Yanıtlar").add({
        "Yazan": req.body["Yazan"],
        "İçerik": req.body["İçerik"],
        "Zaman": admin.firestore.Timestamp.now()
    });
    res.status(200);
    res.redirect("back");
});
//# sourceMappingURL=index.js.map