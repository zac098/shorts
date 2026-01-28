(function(){
  const ano = document.getElementById('ano');
  if (ano) ano.textContent = new Date().getFullYear();

  const tipoRadios = document.querySelectorAll('input[name="contatoTipo"]');
  const contatoLabel = document.getElementById('contatoLabel');
  const contatoValor = document.getElementById('contatoValor');
  const contatoAjuda = document.getElementById('contatoAjuda');
  const form = document.getElementById('pedidoForm');
  const arquivosInput = document.getElementById('arquivos');
  const previews = document.getElementById('previews');
  const statusEl = document.getElementById('status');

  function atualizaCampoContato(){
    const tipo = document.querySelector('input[name="contatoTipo"]:checked').value;
    if(tipo === 'email'){
      contatoLabel.textContent = 'E-mail';
      contatoValor.type = 'email';
      contatoValor.placeholder = 'exemplo@gmail.com';
      contatoValor.setAttribute('inputmode','email');
      contatoAjuda.textContent = 'Digite um endereço de e-mail válido.';
    } else {
      contatoLabel.textContent = 'Número do WhatsApp';
      contatoValor.type = 'text';
      contatoValor.placeholder = '(62) 9 9999-9999';
      contatoValor.setAttribute('inputmode','tel');
      contatoAjuda.textContent = 'Use DDD. Ex.: (62) 9 9999-9999';
    }
  }

  tipoRadios.forEach(r=> r.addEventListener('change', atualizaCampoContato));
  atualizaCampoContato();

  const MAX_FILES = 10;
  const MAX_MB = 10;

  function limparPreviews(){ previews.innerHTML = ''; }
  function bytesMB(b){ return (b/1024/1024).toFixed(2); }

  function renderPreviews(files){
    limparPreviews();
    Array.from(files).forEach((file, idx) => {
      const wrap = document.createElement('div');
      wrap.className = 'thumb';
      const btn = document.createElement('button');
      btn.className = 'remover';
      btn.type = 'button';
      btn.textContent = '×';
      btn.title = 'Remover';

      btn.addEventListener('click', () => {
        const dt = new DataTransfer();
        Array.from(arquivosInput.files).forEach((f,i)=>{ if(i!==idx) dt.items.add(f); });
        arquivosInput.files = dt.files;
        renderPreviews(arquivosInput.files);
      });

      wrap.appendChild(btn);

      if(file.type.startsWith('image/')){
        const img = document.createElement('img');
        const reader = new FileReader();
        reader.onload = e => { img.src = e.target.result; };
        reader.readAsDataURL(file);
        wrap.appendChild(img);
      } else {
        const ph = document.createElement('div');
        ph.style.height = '90px';
        ph.style.display = 'flex';
        ph.style.alignItems = 'center';
        ph.style.justifyContent = 'center';
        ph.textContent = file.name.split('.').pop().toUpperCase();
        wrap.appendChild(ph);
      }

      const nome = document.createElement('div');
      nome.className = 'nome';
      nome.textContent = `${file.name} · ${bytesMB(file.size)} MB`;
      wrap.appendChild(nome);

      previews.appendChild(wrap);
    });
  }

  arquivosInput.addEventListener('change', () => {
    const files = Array.from(arquivosInput.files);
    if(files.length > MAX_FILES){
      status('Você selecionou muitos arquivos. O máximo é ' + MAX_FILES + '.', true);
      arquivosInput.value = '';
      limparPreviews();
      return;
    }
    for(const f of files){
      if(f.size > MAX_MB*1024*1024){
        status(`O arquivo "${f.name}" tem ${bytesMB(f.size)} MB, acima do limite de ${MAX_MB} MB.`, true);
        arquivosInput.value = '';
        limparPreviews();
        return;
      }
    }
    renderPreviews(files);
    status('');
  });

  function status(msg, erro=false){
    statusEl.textContent = msg || '';
    statusEl.className = 'status ' + (erro ? 'error' : (msg ? 'ok' : ''));
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    status('Enviando…');

    const fd = new FormData(form);

    try{
      const BACKEND_URL = 'https://SUA-API-VERCEL.vercel.app/api/pedidos'; // ⬅️ troque após publicar o backend
      const resp = await fetch(BACKEND_URL, { method: 'POST', body: fd });
      if(!resp.ok){
        const txt = await resp.text();
        throw new Error(txt || 'Falha no envio');
      }
      form.reset();
      limparPreviews();
      status('Pedido enviado com sucesso! Em breve entrarei em contato.', false);
    }catch(err){
      console.error(err);
      status('Não consegui enviar pelo servidor agora. Você pode me chamar no WhatsApp com o resumo preenchido 👉', true);
      const tipo = document.querySelector('input[name="contatoTipo"]:checked').value;
      const nome = document.getElementById('nome').value;
      const contato = document.getElementById('contatoValor').value;
      const descricao = document.getElementById('descricao').value;
      const msg = `Olá! Sou ${nome}. Contato (${tipo}): ${contato}%0A%0ADescrição:%0A${encodeURIComponent(descricao)}`;
      const zap = `https://wa.me/5562981991218?text=${msg}`; // seu número
      const a = document.createElement('a');
      a.href = zap;
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = 'Enviar pelo WhatsApp';
      statusEl.appendChild(document.createTextNode(' '));
      statusEl.appendChild(a);
    }
  });
})();