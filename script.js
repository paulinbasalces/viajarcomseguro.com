const SITE_URL = 'https://viajarcomseguro.com';
let dadosFerramentas = [];

const categoriasMeta = [
    { id: 'todos', nome: 'Todas' },
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
    renderizarFiltros();
    configurarBusca();
    configurarModal();
});

async function carregarDados() {
    try {
        const response = await fetch('dados.json');
        if (!response.ok) throw new Error('Falha ao carregar dados');
        dadosFerramentas = await response.json();
        
        const params = new URLSearchParams(window.location.search);
        const itemId = params.get('ferramenta');
        
        renderizarCards(dadosFerramentas);
        
        if (itemId) {
            const item = dadosFerramentas.find(i => i.id === itemId);
            if (item) abrirModal(item);
        }
    } catch (erro) {
        document.getElementById('cards-container').innerHTML = '<p>Erro ao carregar o portal. Tente atualizar a página.</p>';
    }
}

function renderizarFiltros() {
    const container = document.getElementById('filtros-container');
    categoriasMeta.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = `btn-filtro ${cat.id === 'todos' ? 'ativo' : ''}`;
        btn.textContent = cat.nome;
        btn.dataset.categoria = cat.id;
        btn.addEventListener('click', () => filtrarPorCategoria(cat.id, btn));
        container.appendChild(btn);
    });
}

function filtrarPorCategoria(categoriaId, btnAtivo) {
    document.querySelectorAll('.btn-filtro').forEach(b => b.classList.remove('ativo'));
    btnAtivo.classList.add('ativo');
    
    document.getElementById('campo-busca').value = '';
    
    if (categoriaId === 'todos') {
        renderizarCards(dadosFerramentas);
    } else {
        const idOriginal = categoriasMeta.find(c => c.id === categoriaId).nome;
        const filtrados = dadosFerramentas.filter(i => i.categoria === idOriginal);
        renderizarCards(filtrados);
    }
}

function configurarBusca() {
    const campo = document.getElementById('campo-busca');
    campo.addEventListener('input', (e) => {
        const termo = e.target.value.toLowerCase();
        
        document.querySelectorAll('.btn-filtro').forEach(b => b.classList.remove('ativo'));
        document.querySelector('[data-categoria="todos"]').classList.add('ativo');

        if(termo.length < 2) {
            renderizarCards(dadosFerramentas);
            return;
        }

        const filtrados = dadosFerramentas.filter(i => {
            return i.nome.toLowerCase().includes(termo) || 
                   i.descricao.toLowerCase().includes(termo) ||
                   i.dor_resolvida.toLowerCase().includes(termo);
        });
        renderizarCards(filtrados);
    });
}

function renderizarCards(dados) {
    const container = document.getElementById('cards-container');
    container.innerHTML = '';
    
    if(dados.length === 0) {
        container.innerHTML = '<p>Nenhum item encontrado.</p>';
        return;
    }

    dados.forEach(item => {
        const div = document.createElement('div');
        div.className = 'card';
        div.tabIndex = 0;
        div.setAttribute('role', 'button');
        div.innerHTML = `
            <span class="card-tag">${item.categoria}</span>
            <h2>${item.emoji} ${item.nome}</h2>
            <p>${item.dor_resolvida}</p>
        `;
        
        div.addEventListener('click', () => abrirModal(item));
        div.addEventListener('keypress', (e) => { if(e.key === 'Enter') abrirModal(item); });
        
        container.appendChild(div);
    });
}

function abrirModal(item) {
    const modal = document.getElementById('modal-detalhes');
    const body = document.getElementById('modal-body');
    
    body.innerHTML = `
        <span class="card-tag">${item.categoria}</span>
        <h2 id="modal-titulo" style="margin: 8px 0;">${item.emoji} ${item.nome}</h2>
        <p><strong>Problema resolvido:</strong> ${item.dor_resolvida}</p>
        <p style="margin-top: 16px;">${item.descricao}</p>
        <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="modal-link-btn" onclick="registrarClique('${item.id}')">Acessar Ferramenta ➔</a>
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
    window.dataLayer.push({
        event: 'tool_click',
        tool_id: itemId
    });
}