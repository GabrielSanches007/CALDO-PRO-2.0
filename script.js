let produtos = JSON.parse(localStorage.getItem('produtos')) || {
    "TACACÁ": {prod:40, vend:0, custo:7, preco:20},
    "PINTO": {prod:30, vend:0, custo:5, preco:20},
    "CARNE": {prod:50, vend:0, custo:5, preco:20}
};
let vendas = JSON.parse(localStorage.getItem('vendas')) || [];
let WA = localStorage.getItem('wa') || "";
let carrinho = [];

function salvar(){
    localStorage.setItem('produtos', JSON.stringify(produtos));
    localStorage.setItem('vendas', JSON.stringify(vendas));
    localStorage.setItem('wa', WA);
}

function render(){
    const hoje = new Date().toLocaleDateString("pt-BR");
    const vendasHoje = vendas.filter(v => v.data === hoje);
    
    // Cards de Venda
    let htmlVenda = "";
    for(let nome in produtos){
        let p = produtos[nome];
        let disp = p.prod - p.vend;
        htmlVenda += `<div class="card">
            <div style="display:flex; justify-content:space-between">
                <b>${nome} <br><small>R$ ${p.preco}</small></b>
                <span style="color:${disp<=0?'red':'#22c55e'}">${disp<=0?'FALTA':disp+' un'}</span>
            </div>
            <div style="margin:15px 0; font-size:14px">
                Produzido: <input type="number" value="${p.prod}" onchange="produtos['${nome}'].prod=+this.value; salvar(); render();" class="input-produzido">
                Vendido: ${p.vend}
            </div>
            <button class="btn-add" ${disp<=0?'disabled':''} onclick="adicionarCarrinho('${nome}')">+ ADD</button>
        </div>`;
    }
    document.getElementById("produtos").innerHTML = htmlVenda;

    // Métricas
    let fat = vendasHoje.reduce((a,v)=>a+v.preco,0);
    let luc = vendasHoje.reduce((a,v)=>a+(v.preco-v.custo),0);
    document.getElementById("fat").innerText = "R$ " + fat;
    document.getElementById("lucro").innerText = "R$ " + luc;
    document.getElementById("dia").innerText = hoje;

    // Histórico
    document.getElementById("historico").innerHTML = vendasHoje.slice(-5).reverse().map(v => 
        `<div style="display:flex; justify-content:space-between; border-bottom:1px solid #333; padding:5px 0;">
            <span>${v.hora} - ${v.nome}</span> <span>R$ ${v.preco}</span>
        </div>`).join('') || "Sem vendas hoje";

    renderGestao();
}

function renderGestao(){
    let html = "";
    for(let nome in produtos){
        let p = produtos[nome];
        html += `<div class="item-gestao">
            <div style="display:flex; justify-content:space-between; margin-bottom:10px">
                <b style="letter-spacing:1px">${nome}</b>
                <span onclick="removerProduto('${nome}')" style="color:red; cursor:pointer">✖</span>
            </div>
            <div style="display:flex; align-items:center; gap:10px; font-size:14px">
                Preço: R$ <input type="number" value="${p.preco}" onchange="produtos['${nome}'].preco=+this.value; salvar(); render();" class="input-produzido">
                Custo: R$ <input type="number" value="${p.custo}" onchange="produtos['${nome}'].custo=+this.value; salvar(); render();" class="input-produzido">
            </div>
        </div>`;
    }
    document.getElementById("lista-gestao-produtos").innerHTML = html;
}

function adicionarCarrinho(nome){
    let p = produtos[nome];
    let jaNo = carrinho.find(i=>i.nome===nome);
    if((jaNo?jaNo.quantidade:0) >= (p.prod-p.vend)) return alert("Estoque insuficiente!");
    if(jaNo) jaNo.quantidade++;
    else carrinho.push({nome, quantidade:1, preco:p.preco, custo:p.custo});
    renderCarrinho();
}

function renderCarrinho(){
    const cont = document.getElementById("carrinhoContainer");
    cont.innerHTML = carrinho.map((p,i)=>`
        <div style="display:flex; justify-content:space-between; align-items:center; background:#2a2a2a; padding:10px; border-radius:12px; margin-bottom:8px">
            <span>${p.nome} (R$ ${p.preco*p.quantidade})</span>
            <div style="display:flex; align-items:center">
                <button class="btn-mini" onclick="carrinho[${i}].quantidade--; if(carrinho[${i}].quantidade<=0) carrinho.splice(${i},1); renderCarrinho();">➖</button>
                <b style="width:20px; text-align:center">${p.quantidade}</b>
                <button class="btn-mini" onclick="adicionarCarrinho('${p.nome}')">➕</button>
            </div>
        </div>`).join('');
    document.getElementById("cart-count").innerText = carrinho.length;
    document.getElementById("btnVenderTudo").disabled = carrinho.length === 0;
}

function abrirConfirmacao(){
    document.getElementById("resumoFinal").innerHTML = carrinho.map(i=>`• ${i.quantidade}x ${i.nome}`).join('<br>');
    document.getElementById("modalConfirmacao").style.display = "flex";
}

function venderCarrinho(){
    const data = new Date().toLocaleDateString("pt-BR");
    const hora = new Date().toLocaleTimeString("pt-BR", {hour:'2-digit', minute:'2-digit'});
    carrinho.forEach(item => {
        for(let i=0; i<item.quantidade; i++){
            produtos[item.nome].vend++;
            vendas.push({nome:item.nome, preco:item.preco, custo:item.custo, data, hora});
        }
    });
    salvar(); render(); fecharConfirmacao();
    carrinho = []; renderCarrinho();
    alert("Venda realizada!");
}

function adicionarNovoProduto(){
    let n = prompt("Nome do Caldo:").toUpperCase();
    if(n) { produtos[n] = {prod:0, vend:0, custo:5, preco:20}; salvar(); render(); }
}

function removerProduto(n){ if(confirm("Excluir "+n+"?")) { delete produtos[n]; salvar(); render(); } }
function fecharConfirmacao(){ document.getElementById("modalConfirmacao").style.display = "none"; }
function resetarDia(){ if(confirm("Resetar tudo?")) { for(let n in produtos) produtos[n].vend=0; vendas=[]; salvar(); render(); } }

document.getElementById("wa").value = WA;
document.getElementById("wa").onchange = (e) => { WA = e.target.value; salvar(); };
render();
