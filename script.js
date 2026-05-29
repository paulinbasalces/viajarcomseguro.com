let dadosFerramentas = [];

const categoriasMeta = [
    { id: 'comparadores', nome: 'Comparadores' },
    { id: 'europa', nome: 'Europa (Schengen)' },
    { id: 'eua-canada', nome: 'EUA e Canadá' },
    { id: 'nomades', nome: 'Nômades Digitais' },
    { id: 'cartoes', nome: 'Cartões de Crédito' },
    { id: 'intercambio', nome: 'Intercâmbio' },
    { id: 'apoio', nome: 'Documentos e Apoio' }
];

document.addEventListener("DOMContentLoaded", () => {
    carregarDados();
    configurarBusca();
    configurarModal();
});

async function carregarDados() {
    try {
        const response = await fetch('dados.json');
        if (!response.ok) throw new Error('Falha ao carregar dados');
        dadosFerramentas = await response.json();
        
        renderizarAncoras();
        renderizarSecoes(dadosFerramentas);

        const params = new URLSearchParams(window.location.search);
        const itemId = params.get('ferramenta');
        if (itemId) {
            const item = dadosFerramentas.find(i => i.id === itemId);
            if (item) abrirModal(item);
        }
    } catch (erro) {
        document.getElementById('content-sections').innerHTML = '<p>Erro ao carregar os dados. Verifique a base JSON.</p>';
    }
}

function renderizarAncoras() {
    const container = document.getElementById('ancoras-container');
    categoriasMeta.forEach(cat => {
        const a = document.createElement('a');
        a.href = `#sec-${cat.id}`;
        a.textContent = cat.nome;
        container.appendChild(a);
    });
}

function renderizarSecoes(dados) {
    const main = document.getElementById('content-sections');
    main.innerHTML = '';

    categoriasMeta.forEach((cat, index) => {
        const itens = dados.filter(i => i.categoria === cat.nome);
        if (itens.length === 0) return;

        const section = document.createElement('section');
        section.className = 'category-section';
        section.id = `sec-${cat.id}`;

        const numSecao = String(index + 1).padStart(2, '0');

        let htmlCards = itens.map(item => `
            <div class="card">
                <div class="card-top">
                    <span class="card-icon">${item.emoji}</span>
                    <h3>${item.nome}</h3>
                </div>
                <p class="card-desc">${item.dor_resolvida}</p>
                <div class="card-actions">
                    <button class="btn-card" onclick="abrirModalPorId('${item.id}')">Ver detalhes</button>
                    <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="btn-card primary" onclick="registrarClique('${item.id}')">Acessar site ➔</a>
                </div>
            </div>
        `).join('');

        section.innerHTML = `
            <div class="category-header">
                <h2><span>${numSecao}.</span> ${cat.nome}</h2>
                <span class="item-count">${itens.length} opções listadas</span>
            </div>
            <div class="card-grid">
                ${htmlCards}
            </div>
        `;
        main.appendChild(section);
    });

    if(main.innerHTML === '') {
        main.innerHTML = '<p style="text-align:center; padding: 40px;">Nenhum resultado encontrado para esta busca.</p>';
    }
}

function configurarBusca() {
    const campo = document.getElementById('campo-busca');
    campo.addEventListener('input', (e) => {
        const termo = e.target.value.toLowerCase();
        
        if(termo.length < 2) {
            renderizarSecoes(dadosFerramentas);
            return;
        }

        const filtrados = dadosFerramentas.filter(i => {
            return i.nome.toLowerCase().includes(termo) || 
                   i.descricao.toLowerCase().includes(termo) ||
                   i.dor_resolvida.toLowerCase().includes(termo);
        });
        renderizarSecoes(filtrados);
    });
}

window.abrirModalPorId = function(id) {
    const item = dadosFerramentas.find(i => i.id === id);
    if(item) abrirModal(item);
}

function abrirModal(item) {
    const modal = document.getElementById('modal-detalhes');
    const body = document.getElementById('modal-body');
    
    body.innerHTML = `
        <span style="font-size: 0.8rem; font-weight: bold; color: #666; text-transform: uppercase;">${item.categoria}</span>
        <h2 id="modal-titulo" style="margin: 8px 0 16px; font-size: 1.8rem;">${item.emoji} ${item.nome}</h2>
        <p style="font-size: 1.1rem; margin-bottom: 24px; color: #1a1a1a;"><strong>Aplica-se em:</strong> ${item.dor_resolvida}</p>
        <p style="line-height: 1.6; color: #444; border-left: 3px solid #EAEAEA; padding-left: 16px; margin-bottom: 32px;">${item.descricao}</p>
        <div style="display:flex; gap: 12px;">
            <a href="${item.url}" target="_blank" rel="noopener noreferrer" style="flex:1; background: #1A1A1A; color: #FFF; text-align:center; padding: 16px; border-radius: 6px; text-decoration: none; font-weight: bold;" onclick="registrarClique('${item.id}')">Acessar Ferramenta Oficial ➔</a>
        </div>
    `;
    
    window.history.pushState({}, '', `?ferramenta=${item.id}`);
    modal.showModal();
}

function configurarModal() {
    const modal = document.getElementById('modal-detalhes');
    const btnFechar = document.getElementById('fechar-modal');
    
    btnFechar.addEventListener('click', () => {
        modal.close();
        window.history.pushState({}, '', window.location.pathname);
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.close();
            window.history.pushState({}, '', window.location.pathname);
        }
    });
}

function registrarClique(itemId) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: 'tool_click', tool_id: itemId });
}
