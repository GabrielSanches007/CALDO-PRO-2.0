let produtos = JSON.parse(localStorage.getItem('produtos')) || {
    "TACACÁ": {prod:40, vend:0, custo:7, preco:25},
    "PINTO": {prod:30, vend:0, custo:4, preco:20},
    "CARNE": {prod:50, vend:0, custo:6, preco:20}
};
let vendas = JSON.parse(localStorage.getItem('vendas')) || [];
let WA = localStorage.getItem('wa') || "5569993123433";
let carrinho = [];

function salvar(){
    localStorage.setItem('produtos', JSON.stringify(produtos));
    localStorage.setItem('vendas', JSON.stringify(vendas));
    localStorage.setItem('wa', WA);
}

function render(){
    const hoje = new Date().toLocaleDateString("pt-BR");
    const vendasHoje = vendas.filter(v => v.data === hoje);
    
    let htmlProds = "";
    for(let nome in produtos){
        let p = produtos[nome];
        let disp = p.prod - p.vend;
        htmlProds += `
        <div class="card">
            <div style="display:flex; justify-content:space-between; align-items:center">
                <b>${nome} <br><small>R$ ${p.preco}</small></b>
                <span class="${disp <= 0 ? 'red-stock' : 'green'}" style="font-size:13px">${disp <= 0 ? 'ESGOTADO' : disp + ' em estoque'}</span>
            </div>
            <div style="margin:15px 0; font-size:14px; display:flex; align-items:center;">
                Prod: <input type="number" value="${p.prod}" onchange="alterarProd('${nome}', this.value)" class="input-produzido">
                <span style="margin-left:12px">Vendidos: <b>${p.vend}</b></span>
            </div>
            <button class="btn-add" ${disp <= 0 ? 'disabled' : ''} onclick="adicionarCarrinho('${nome}')">+ ADICIONAR</button>
        </div>`;
    }
    document.getElementById("produtos").innerHTML = htmlProds;

    let fat = vendasHoje.reduce((a,v)=>a+v.preco, 0);
    let luc = vendasHoje.reduce((a,v)=>a+(v.preco-v.custo), 0);
    document.getElementById("fat").innerText = "R$ " + fat;
    document.getElementById("lucro").innerText = "R$ " + luc;
    document.getElementById("dia").innerText = hoje;

    if(vendasHoje.length > 0){
        document.getElementById("ticket-medio").innerText = "R$ " + (fat/vendasHoje.length).toFixed(2);
        const horas = vendasHoje.map(v => v.hora.split(':')[0]);
        const freq = horas.reduce((a,b) => { a[b] = (a[b]||0)+1; return a; }, {});
        const pico = Object.keys(freq).reduce((a,b) => freq[a] > freq[b] ? a : b);
        document.getElementById("hora-pico").innerText = pico + ":00h";
    } else {
        document.getElementById("ticket-medio").innerText = "R$ 0";
        document.getElementById("hora-pico").innerText = "--";
    }

    renderGestao();
}

function alterarProd(nome, valor) {
    produtos[nome].prod = +valor;
    salvar();
    render();
}

function renderGestao(){
    let html = "";
    for(let nome in produtos){
        html += `<div class="item-gestao">
            <span>${nome}</span>
            <div style="display:flex; gap:10px; align-items:center">
                <small>R$${produtos[nome].preco}</small>
                <button onclick="removerProduto('${nome}')" class="btn-mini" style="background:none !important; color:var(--danger)">✖</button>
            </div>
        </div>`;
    }
    document.getElementById("lista-gestao-produtos").innerHTML = html;
}

function adicionarCarrinho(nome){
    let p = produtos[nome];
    let disp = p.prod - p.vend;
    let jaNoCart = carrinho.find(i => i.nome === nome);
    if((jaNoCart ? jaNoCart.quantidade : 0) >= disp) return alert("Estoque máximo atingido!");
    if(jaNoCart) jaNoCart.quantidade++;
    else carrinho.push({nome, quantidade: 1, preco: p.preco, custo: p.custo});
    renderCarrinho();
}

function renderCarrinho(){
    const cont = document.getElementById("carrinhoContainer");
    let html = "";
    carrinho.forEach((p, i) => {
        html += `<div class="item-carrinho">
            <span><b>${p.quantidade}x</b> ${p.nome}</span>
            <div style="display:flex; gap:5px">
                <button class="btn-mini" onclick="carrinho[${i}].quantidade--; if(carrinho[${i}].quantidade<=0) carrinho.splice(${i},1); renderCarrinho();">➖</button>
                <button class="btn-mini" onclick="adicionarCarrinho('${p.nome}')">➕</button>
            </div>
        </div>`;
    });
    cont.innerHTML = html || "<p style='opacity:0.5; text-align:center'>Seu carrinho está vazio</p>";
    document.getElementById("cart-count").innerText = carrinho.reduce((a,b)=>a+b.quantidade,0);
    document.getElementById("btnVenderTudo").disabled = carrinho.length === 0;
}

function abrirConfirmacao(){
    let html = ""; let total = 0;
    carrinho.forEach(i => {
        total += (i.quantidade * i.preco);
        html += `<div>• ${i.quantidade}x ${i.nome} - R$ ${i.quantidade * i.preco}</div>`;
    });
    document.getElementById("resumoFinal").innerHTML = html + `<hr><b>TOTAL: R$ ${total}</b>`;
    document.getElementById("modalConfirmacao").style.display = "flex";
}

function fecharConfirmacao(){ document.getElementById("modalConfirmacao").style.display = "none"; }

function venderCarrinho(){
    const data = new Date().toLocaleDateString("pt-BR");
    const hora = new Date().toLocaleTimeString("pt-BR", {hour:'2-digit', minute:'2-digit'});
    let totalVenda = 0;
    let msg = `📊 *RELATÓRIO DE VENDA*\n📅 ${data} às ${hora}\n━━━━━━━━━━━\n`;

    carrinho.forEach(item => {
        totalVenda += (item.quantidade * item.preco);
        msg += `🍲 *${item.nome}* (${item.quantidade}x)\n`;
        for(let i=0; i<item.quantidade; i++){
            produtos[item.nome].vend++;
            vendas.push({nome: item.nome, preco: item.preco, custo: item.custo, data, hora});
        }
    });

    msg += `━━━━━━━━━━━\n💰 *VALOR:* R$ ${totalVenda}\n✅ Venda Finalizada!`;
    salvar(); fecharConfirmacao(); 
    window.open(`https://api.whatsapp.com/send?phone=${WA.replace(/\D/g,'')}&text=${encodeURIComponent(msg)}`, "_blank");
    carrinho = []; renderCarrinho(); render();
}

function adicionarNovoProduto(){
    let n = prompt("Nome do novo produto:");
    if(n){
        let preco = +prompt("Preço de venda:", "20");
        let custo = +prompt("Preço de custo:", "5");
        produtos[n.toUpperCase()] = {prod:0, vend:0, custo:custo, preco:preco}; 
        salvar(); render(); 
    }
}

function removerProduto(n){ if(confirm("Remover "+n+"?")){ delete produtos[n]; salvar(); render(); } }
function resetarDia(){ if(confirm("Zerar hoje?")){ for(let n in produtos) produtos[n].vend=0; vendas=[]; salvar(); render(); } }

document.getElementById("wa").value = WA;
document.getElementById("wa").onchange = (e) => { WA = e.target.value; salvar(); };

render();
