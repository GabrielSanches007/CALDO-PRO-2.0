/* CALDOS PRO - Versão Ember Edition 1.8 
   Lógica de Negócio, Gestão e Relatórios Dinâmicos
*/

// Carregamento de dados iniciais ou do LocalStorage
let produtos = JSON.parse(localStorage.getItem('produtos')) || {
    "TACACÁ": {prod:40, vend:0, custo:8, preco:25},
    "PINTO": {prod:30, vend:0, custo:5, preco:20},
    "CARNE": {prod:50, vend:0, custo:6, preco:20}
};
let vendas = JSON.parse(localStorage.getItem('vendas')) || [];
let WA = localStorage.getItem('wa') || "";
let carrinho = [];

// Função para salvar tudo no navegador
function salvar(){
    localStorage.setItem('produtos', JSON.stringify(produtos));
    localStorage.setItem('vendas', JSON.stringify(vendas));
    localStorage.setItem('wa', WA);
}

// Formatador de Moeda para a Interface
const formatarR$ = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function render(){
    const hoje = new Date().toLocaleDateString("pt-BR");
    const vendasHoje = vendas.filter(v => v.data === hoje);
    
    // 1. RENDERIZAR CARDS DE VENDA (MENU PRINCIPAL)
    let htmlVenda = "";
    for(let nome in produtos){
        let p = produtos[nome];
        let disp = p.prod - p.vend;
        htmlVenda += `
        <div class="product-sale-card">
            <div style="display:flex; justify-content:space-between; align-items:start">
                <div>
                    <h4 style="margin:0; font-size:1.1rem">${nome}</h4>
                    <span style="color:var(--primary); font-weight:800; font-size:1rem">${formatarR$(p.preco)}</span>
                </div>
                <span class="stock-pill ${disp <= 5 ? 'pill-warn' : 'pill-ok'}">
                    <i class="fa-solid fa-layer-group"></i> ${disp <= 0 ? 'ESGOTADO' : disp + ' un'}
                </span>
            </div>
            <div style="display:flex; align-items:center; justify-content:space-between; margin-top:20px">
                <small style="color:var(--text-dim); font-size:0.75rem">Produzido: 
                    <input type="number" value="${p.prod}" onchange="alterarEstoque('${nome}', this.value)" class="input-minimal" style="width:50px">
                </small>
                <button class="btn-add-sales" ${disp <= 0 ? 'disabled' : ''} onclick="adicionarCarrinho('${nome}')">
                    ADICIONAR <i class="fa-solid fa-cart-plus"></i>
                </button>
            </div>
        </div>`;
    }
    document.getElementById("produtos").innerHTML = htmlVenda;

    // 2. DASHBOARD DE FATURAMENTO E LUCRO
    let fatTotal = vendasHoje.reduce((a,v) => a + v.preco, 0);
    let lucTotal = vendasHoje.reduce((a,v) => a + (v.preco - v.custo), 0);
    document.getElementById("fat").innerText = formatarR$(fatTotal);
    document.getElementById("lucro").innerText = formatarR$(lucTotal);
    document.getElementById("dia").innerText = hoje;

    // 3. MÉTRICAS EXECUTIVAS
    if(vendasHoje.length > 0) {
        document.getElementById("ticket-medio").innerText = formatarR$(fatTotal / vendasHoje.length);
        const horas = vendasHoje.map(v => v.hora.split(':')[0]);
        const pico = horas.sort((a,b) => horas.filter(v=>v===a).length - horas.filter(v=>v===b).length).pop();
        document.getElementById("hora-pico").innerText = pico + ":00h";
    }

    renderGestao();
}

// Alterar quantidade produzida direto no card
function alterarEstoque(nome, valor) {
    produtos[nome].prod = Math.max(0, parseInt(valor) || 0);
    salvar(); render();
}

// Adicionar item ao Carrinho
function adicionarCarrinho(nome){
    let p = produtos[nome];
    let disp = p.prod - p.vend;
    let noCart = carrinho.find(i => i.nome === nome);
    
    if((noCart ? noCart.quantidade : 0) >= disp) return; // Bloqueia se acabar o estoque

    if(noCart) noCart.quantidade++;
    else carrinho.push({nome, quantidade: 1, preco: p.preco, custo: p.custo});
    renderCarrinho();
}

// Mostrar itens no Carrinho
function renderCarrinho(){
    const cont = document.getElementById("carrinhoContainer");
    let totalC = 0;
    cont.innerHTML = carrinho.map((p, i) => {
        totalC += (p.preco * p.quantidade);
        return `
        <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.03); padding:12px; border-radius:12px; margin-bottom:8px">
            <div><b>${p.nome}</b><br><small style="color:var(--accent)">${formatarR$(p.preco * p.quantidade)}</small></div>
            <div style="display:flex; align-items:center">
                <button class="btn-mini" onclick="removerUm('${i}')">-</button>
                <b style="width:25px; text-align:center">${p.quantidade}</b>
                <button class="btn-mini" onclick="adicionarCarrinho('${p.nome}')">+</button>
            </div>
        </div>`;
    }).join('') || "<p style='opacity:0.3; text-align:center; padding:10px'>Carrinho vazio...</p>";
    
    document.getElementById("cart-count").innerText = carrinho.reduce((a,b) => a + b.quantidade, 0);
    document.getElementById("btnVenderTudo").disabled = carrinho.length === 0;
}

function removerUm(index) {
    carrinho[index].quantidade--;
    if(carrinho[index].quantidade <= 0) carrinho.splice(index, 1);
    renderCarrinho();
}

// FUNÇÃO DE VENDA E RELATÓRIO WHATSAPP (SEU MODELO PEDIDO)
function venderCarrinho(){
    const dataAtual = new Date().toLocaleDateString("pt-BR");
    const horaVenda = new Date().toLocaleTimeString("pt-BR", {hour:'2-digit', minute:'2-digit'});
    
    // CABEÇALHO DO RELATÓRIO
    let relatorio = `📊*RELATÓRIO DE VENDAS - ${dataAtual}*\n\n`;
    let totalVendaGeral = 0;

    carrinho.forEach(item => {
        let subtotal = item.quantidade * item.preco;
        totalVendaGeral += subtotal;

        // MODELO: 🍲 *CARNE* (1x) - R$20 PAGO✅ às 20:06
        relatorio += `🍲 *${item.nome}* (${item.quantidade}x) - R$${subtotal} PAGO✅ às ${horaVenda}\n`;

        // Registrar no histórico e estoque
        for(let i=0; i < item.quantidade; i++){
            produtos[item.nome].vend++;
            vendas.push({
                nome: item.nome, 
                preco: item.preco, 
                custo: item.custo, 
                data: dataAtual, 
                hora: horaVenda
            });
        }
    });
    
    relatorio += `\n💰 *TOTAL: R$ ${totalVendaGeral}*`;

    salvar(); 
    fecharConfirmacao(); 

    // Envio para WhatsApp
    if(WA) {
        let cleanWA = WA.replace(/\D/g,'');
        window.open(`https://api.whatsapp.com/send?phone=${cleanWA}&text=${encodeURIComponent(relatorio)}`);
    }

    carrinho = []; 
    renderCarrinho(); 
    render();
}

// GESTÃO DE PRODUTOS (AJUSTE DE PREÇO E CUSTO)
function renderGestao(){
    document.getElementById("lista-gestao-produtos").innerHTML = Object.keys(produtos).map(n => `
        <div class="management-item">
            <div style="display:flex; justify-content:space-between; align-items:center">
                <b>${n}</b>
                <i class="fa-solid fa-trash-can" style="color:var(--danger); cursor:pointer" onclick="removerProduto('${n}')"></i>
            </div>
            <div style="display:flex; gap:10px; margin-top:10px">
                <div style="flex:1"><small style="color:var(--text-dim); font-size:10px">PREÇO VENDA</small> R$ <input type="number" value="${produtos[n].preco}" onchange="produtos['${n}'].preco=+this.value; salvar(); render();" class="input-minimal" style="width:80%"></div>
                <div style="flex:1"><small style="color:var(--text-dim); font-size:10px">CUSTO PROD.</small> R$ <input type="number" value="${produtos[n].custo}" onchange="produtos['${n}'].custo=+this.value; salvar(); render();" class="input-minimal" style="width:80%"></div>
            </div>
        </div>
    `).join('');
}

// Modais e Funções de Sistema
function abrirConfirmacao(){
    document.getElementById("resumoFinal").innerHTML = carrinho.map(i => `• ${i.quantidade}x ${i.nome} - R$ ${i.quantidade * i.preco}`).join('<br>');
    document.getElementById("modalConfirmacao").style.display = "flex";
}
function fecharConfirmacao(){ document.getElementById("modalConfirmacao").style.display = "none"; }

function adicionarNovoProduto(){
    let n = prompt("NOME DO PRODUTO:").toUpperCase();
    if(n) {
        produtos[n] = {prod:0, vend:0, custo:7, preco:20};
        salvar(); render();
    }
}
function removerProduto(n){ if(confirm("Deseja excluir "+n+"?")) { delete produtos[n]; salvar(); render(); } }

function resetarDia(){
    if(confirm("ATENÇÃO: Isso zerará todas as vendas de hoje e o estoque vendido. Continuar?")){
        for(let n in produtos) produtos[n].vend = 0;
        vendas = [];
        salvar(); render();
        alert("Operação reiniciada!");
    }
}

// Configuração do WhatsApp
document.getElementById("wa").value = WA;
document.getElementById("wa").onchange = (e) => { WA = e.target.value; salvar(); };

// Iniciar App
render();
