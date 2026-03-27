/* CALDOS PRO - EMBER EDITION 6.0 (COM DETALHAMENTO) */

let produtos = JSON.parse(localStorage.getItem('produtos')) || {
    "TACACÁ": {prodDia: 0, vendDia: 0, custo: 8, preco: 25},
    "PINTO": {prodDia: 0, vendDia: 0, custo: 5, preco: 20},
    "CARNE": {prodDia: 0, vendDia: 0, custo: 6, preco: 20}
};

let vendas = JSON.parse(localStorage.getItem('vendas')) || [];
let historicoDias = JSON.parse(localStorage.getItem('historicoDias')) || [];
let WA = localStorage.getItem('wa') || "";
let carrinho = [];
let formaPagamento = "PIX";

function salvar() {
    localStorage.setItem('produtos', JSON.stringify(produtos));
    localStorage.setItem('vendas', JSON.stringify(vendas));
    localStorage.setItem('historicoDias', JSON.stringify(historicoDias));
    localStorage.setItem('wa', WA);
}

const formatarR$ = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function render() {
    const hoje = new Date().toLocaleDateString("pt-BR");
    const vHoje = vendas.filter(v => v.data === hoje);

    let fatTotal = vHoje.reduce((a, v) => a + v.preco, 0);
    let custoTotal = vHoje.reduce((a, v) => a + (v.custo || 0), 0);
    
    document.getElementById("fat").innerText = formatarR$(fatTotal);
    document.getElementById("lucro").innerText = formatarR$(fatTotal - custoTotal);
    document.getElementById("dia").innerText = hoje;

    // Estatísticas Rápidas
    const ticket = vHoje.length > 0 ? fatTotal / vHoje.length : 0;
    document.getElementById("ticket-medio").innerText = formatarR$(ticket);
    const horas = vHoje.map(v => v.hora.split(':')[0]);
    const pico = horas.sort((a,b) => horas.filter(v => v===a).length - horas.filter(v => v===b).length).pop();
    document.getElementById("hora-pico").innerText = pico ? pico + ":00" : "--:--";

    // --- RESUMO DETALHADO POR CALDO (SIDEBAR HISTÓRICO) ---
    let resumoItensHTML = "";
    let agrupado = {};
    
    vHoje.forEach(v => {
        if(!agrupado[v.nome]) agrupado[v.nome] = {qtd: 0, totalVenda: 0, totalLucro: 0};
        agrupado[v.nome].qtd++;
        agrupado[v.nome].totalVenda += v.preco;
        agrupado[v.nome].totalLucro += (v.preco - (v.custo || 0));
    });

    for(let nome in agrupado) {
        let item = agrupado[nome];
        resumoItensHTML += `
            <div class="detalhe-item-resumo">
                <div style="font-size:12px; font-weight:800; color:var(--primary)">${item.qtd} ${nome}</div>
                <div><span class="text-venda">Venda Total: ${formatarR$(item.totalVenda)}</span></div>
                <div><span class="text-lucro">Lucro Total: ${formatarR$(item.totalLucro)}</span></div>
            </div>`;
    }

    document.getElementById("resumo-sidebar-lucro").innerHTML = `
        <div style="background:linear-gradient(to bottom right, var(--primary), #ea580c); color:#fff; padding:20px; border-radius:18px; box-shadow: 0 10px 20px rgba(0,0,0,0.2)">
            <p style="margin:0; font-size:10px; font-weight:800; opacity:0.8; text-transform:uppercase">Resumo Financeiro</p>
            <h3 style="margin:5px 0; font-size:1.8rem; font-weight:900;">${formatarR$(fatTotal - custoTotal)}</h3>
            <p style="margin:0; font-size:11px; opacity:0.9">Lucro de hoje (${formatarR$(fatTotal)} bruto)</p>
            ${resumoItensHTML}
        </div>
    `;

    // Lista de Vendas Individuais
    document.getElementById("lista-historico").innerHTML = vHoje.map((v, i) => `
        <div class="venda-item-sidebar">
            <div style="display:flex; justify-content:space-between; align-items:center">
                <div>
                    <b>${v.nome}</b><br>
                    <small style="color:var(--text-dim); font-size:10px">${v.hora} | ${v.pagto}</small>
                </div>
                <div style="display:flex; align-items:center; gap:10px">
                    <span style="color:var(--success); font-weight:800">${formatarR$(v.preco)}</span>
                    <button onclick="excluirVendaIndividual(${vendas.indexOf(v)})" style="background:none; border:none; color:var(--danger); cursor:pointer"><i class="fa-solid fa-trash-can"></i></button>
                </div>
            </div>
        </div>`).reverse().join('') || "<p style='text-align:center; opacity:0.2; margin-top:20px'>Aguardando vendas.</p>";

    // Cardápio
    let htmlP = "";
    for (let n in produtos) {
        let p = produtos[n]; let d = p.prodDia - p.vendDia;
        htmlP += `
        <div class="product-sale-card">
            <div style="display:flex; justify-content:space-between">
                <div><h4 style="margin:0">${n}</h4><b style="color:var(--primary)">${formatarR$(p.preco)}</b></div>
                <span class="stock-pill ${d <= 5 ? 'pill-warn' : 'pill-ok'}">${d <= 0 ? 'FIM' : d + ' un'}</span>
            </div>
            <button onclick="adicionarCarrinho('${n}')" class="btn-add-sales" ${d <= 0 ? 'disabled' : ''}>+ ADICIONAR</button>
        </div>`;
    }
    document.getElementById("produtos").innerHTML = htmlP;
    renderGestao();
}

// ARQUIVAR DIA (COM DETALHAMENTO)
function arquivarDiaAtual() {
    const hoje = new Date().toLocaleDateString("pt-BR");
    const vHoje = vendas.filter(v => v.data === hoje);
    if (vHoje.length > 0) {
        let agrupado = {};
        vHoje.forEach(v => {
            if(!agrupado[v.nome]) agrupado[v.nome] = {qtd: 0, venda: 0, lucro: 0};
            agrupado[v.nome].qtd++;
            agrupado[v.nome].venda += v.preco;
            agrupado[v.nome].lucro += (v.preco - (v.custo || 0));
        });

        const resumo = { 
            data: hoje, 
            faturamento: vHoje.reduce((a, b) => a + b.preco, 0), 
            lucro: vHoje.reduce((a, b) => a + (b.preco - b.custo), 0),
            detalhes: agrupado 
        };
        
        const idx = historicoDias.findIndex(h => h.data === hoje);
        if (idx !== -1) historicoDias[idx] = resumo; else historicoDias.push(resumo);
    }
    salvar();
}

function renderRelatorios() {
    const container = document.getElementById("lista-relatorios-dias");
    if (!historicoDias.length) { container.innerHTML = "<p style='text-align:center; opacity:0.2; margin-top:20px'>Sem histórico.</p>"; return; }
    
    container.innerHTML = historicoDias.slice().reverse().map((dia, idx) => {
        let detalhesHTML = "";
        for(let n in dia.detalhes) {
            let det = dia.detalhes[n];
            detalhesHTML += `<div style="font-size:10px; color:#94a3b8; border-top:1px solid #222; padding-top:4px; margin-top:4px">
                <b>${det.qtd} ${n}</b>: ${formatarR$(det.venda)} venda / <span style="color:var(--success)">${formatarR$(det.lucro)} lucro</span>
            </div>`;
        }

        return `
        <div class="relatorio-card">
            <div style="display:flex; justify-content:space-between; margin-bottom:10px">
                <span style="color:var(--primary); font-weight:800">${dia.data}</span>
                <button onclick="excluirDiaRelatorio(${historicoDias.length - 1 - idx})" style="background:none; border:none; color:var(--danger); cursor:pointer"><i class="fa-solid fa-trash"></i></button>
            </div>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-bottom:10px">
                <div style="background:rgba(0,0,0,0.2); padding:10px; border-radius:10px; text-align:center"><small style="display:block; font-size:9px">VENDAS</small><b>${formatarR$(dia.faturamento)}</b></div>
                <div style="background:rgba(0,0,0,0.2); padding:10px; border-radius:10px; text-align:center"><small style="display:block; font-size:9px">LUCRO</small><b style="color:var(--success)">${formatarR$(dia.lucro)}</b></div>
            </div>
            ${detalhesHTML}
        </div>`;
    }).join('');
}

// ... (Restante das funções: mudarAba, toggleSidebar, adicionarCarrinho, venderCarrinho, etc permanecem as mesmas da base) ...

function mudarAba(aba) {
    document.querySelectorAll('.sidebar-content').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`aba-${aba}`).classList.add('active');
    document.getElementById(`tab-${aba[0]}`).classList.add('active');
    if(aba === 'relatorio') renderRelatorios();
}
function toggleSidebar() { document.getElementById("sidebarAdmin").classList.toggle("active"); document.getElementById("overlay").classList.toggle("active"); }
function setPagamento(t) { formaPagamento = t; document.querySelectorAll('.pay-btn').forEach(b => b.classList.remove('active')); document.getElementById(`pay-${t}`).classList.add('active'); }
function adicionarCarrinho(n) {
    let p = produtos[n]; let d = p.prodDia - p.vendDia; let noC = carrinho.find(c => c.nome === n);
    if((noC?noC.quantidade:0) >= d) return;
    if(noC) noC.quantidade++; else carrinho.push({nome:n, quantidade:1, preco:p.preco, custo:p.custo});
    renderCarrinho();
}
function renderCarrinho() {
    document.getElementById("carrinhoContainer").innerHTML = carrinho.map((p, i) => `
        <div style="display:flex; justify-content:space-between; padding:10px; background:rgba(255,255,255,0.03); border-radius:10px; margin-bottom:5px">
            <span><b>${p.nome}</b> (x${p.quantidade})</span>
            <button onclick="carrinho.splice(${i},1); renderCarrinho();" style="color:var(--danger); background:none; border:none; font-weight:800">X</button>
        </div>`).join('') || "<p style='text-align:center; opacity:0.3'>Vazio</p>";
    document.getElementById("cart-count").innerText = carrinho.reduce((a,b)=>a+b.quantidade, 0);
    document.getElementById("btnVenderTudo").disabled = !carrinho.length;
}
function venderCarrinho() {
    const agora = new Date();
    const h = agora.toLocaleTimeString("pt-BR", {hour:'2-digit', minute:'2-digit'});
    const d = agora.toLocaleDateString("pt-BR");
    carrinho.forEach(item => {
        produtos[item.nome].vendDia += item.quantidade;
        for(let i=0; i<item.quantidade; i++) vendas.push({nome:item.nome, preco:item.preco, custo:item.custo, data:d, hora:h, pagto:formaPagamento});
    });
    carrinho = []; salvar(); render(); renderCarrinho(); fecharConfirmacao();
}
function renderGestao() {
    let html = "";
    for (let n in produtos) {
        let p = produtos[n];
        html += `
        <div class="management-item" style="background:#1a1a20; padding:15px; border-radius:16px; margin-bottom:12px; border:1px solid #2a2a32;">
            <div style="display:flex; justify-content:space-between; margin-bottom:10px"><b>${n}</b> <button onclick="removerProduto('${n}')" style="background:none; border:none; color:var(--danger)"><i class="fa-solid fa-trash"></i></button></div>
            <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:5px">
                <input type="number" class="input-mini" value="${p.prodDia}" onchange="produtos['${n}'].prodDia=Number(this.value); salvar(); render();">
                <input type="number" step="0.1" class="input-mini" value="${p.custo}" onchange="produtos['${n}'].custo=Number(this.value); salvar(); render();">
                <input type="number" step="0.1" class="input-mini" value="${p.preco}" onchange="produtos['${n}'].preco=Number(this.value); salvar(); render();">
            </div>
        </div>`;
    }
    document.getElementById("lista-gestao-produtos").innerHTML = html;
}
function resetarDia() { if(confirm("Deseja zerar o dia e salvar no Relatório?")) { arquivarDiaAtual(); vendas = []; for(let n in produtos) produtos[n].vendDia = 0; salvar(); render(); alert("Dia finalizado!"); } }
function excluirVendaIndividual(index) { if(confirm("Excluir esta venda?")) { const v = vendas[index]; if(produtos[v.nome]) produtos[v.nome].vendDia = Math.max(0, produtos[v.nome].vendDia - 1); vendas.splice(index, 1); salvar(); render(); } }
function abrirConfirmacao() { document.getElementById("resumoFinal").innerText = carrinho.map(i=>`${i.quantidade}x ${i.nome}`).join(', '); document.getElementById("modalConfirmacao").style.display="flex"; }
function fecharConfirmacao() { document.getElementById("modalConfirmacao").style.display="none"; }
function adicionarNovoProduto() { let n = prompt("NOME:").toUpperCase(); if(n) { produtos[n]={prodDia:0, vendDia:0, custo:7, preco:20}; salvar(); render(); } }
function removerProduto(n) { if(confirm("Remover "+n+"?")) { delete produtos[n]; salvar(); render(); } }
function resetarRelatorioMensal() { if(confirm("Limpar tudo?")) { historicoDias=[]; salvar(); renderRelatorios(); } }
function excluirDiaRelatorio(idx) { historicoDias.splice(idx,1); salvar(); renderRelatorios(); }

document.getElementById("wa").value = WA;
document.getElementById("wa").onchange = (e) => { WA = e.target.value; salvar(); };

render();
