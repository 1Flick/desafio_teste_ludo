/**
 * ESPECIFICAÇÃO EXECUTÁVEL — LUDO PARA DOIS JOGADORES
 * Origem: github.com/JoaoChoma/teste_software_2026/blob/main/desafios.md
 * Exigido no enunciado: JavaScript, partida para 02 jogadores.
 * Colaboradores: Pedro Lucas Gomes Braido (24190443-2);
 * Leonardo Fratoni Borges da Silva (24047610-2).
 *
 * Node.js >= 24. Crie ludo.js exportando class Ludo (ESM), ao lado deste teste.
 * Execute node --test ludo.test.js. Opcional: MODULO_LUDO = caminho alternativo.
 *
 * CONTRATO: new Ludo(); rolar(jogador,dado):Array<indice>; mover(jogador,indice):
 * progresso; legais(jogador,dado):Array<indice>; casa(jogador,progresso):0..51.
 * Estado público: peoes=[[-1,-1,-1,-1],[-1,-1,-1,-1]], turno=0, dado=null,
 * seis=0 (consecutivos do turno), vencedor=null|0|1. Não há sorteio dentro de rolar:
 * o DADO 1..6 é uma entrada, para separar aleatoriedade da regra testada.
 *
 * VARIANTE ESCOLHIDA EXPLICITAMENTE, POIS O ENUNCIADO NÃO FIXA ESTAS REGRAS:
 * - Quatro peões por jogador. Progresso -1=base; 0..51=pista compartilhada;
 *   52..56=reta final privada; 57=chegada. Entradas distam 26 casas:
 *   casa global=(progresso+26*jogador)%52, somente para progresso 0..51.
 * - Seis retira peão da base PARA 0 (não para 6), ou avança peão já na pista.
 * - Chegada é por dado exato. Peão em 57 não anda e excesso não rebate.
 * - Cada rolagem deve ser seguida por escolha de UM índice legal antes de outra.
 * - Se não houver jogada legal, passa automaticamente, EXCETO seis que concede
 *   nova rolagem. Não se pode voluntariamente passar tendo movimento.
 * - Seis concede outra rolagem após mover. TERCEIRO seis seguido perde só a
 *   terceira jogada, sem desfazer as duas anteriores. Dado fica null e troca vez.
 * - Um resultado não-seis quebra a sequência. Trocar turno zera seis.
 * - Casas seguras GLOBAIS: 0,8,13,21,26,34,39,47.
 * - Aterrissar em casa comum devolve TODOS os peões rivais ali à base.
 *   Não captura ao PASSAR POR CIMA, nem em casa segura, nem na reta final.
 * - Não existem barreiras: peões podem empilhar e atravessar adversários.
 *   Captura e chegada não dão rodada extra (a menos que o dado seja seis).
 * - Vence ao colocar OS QUATRO peões em 57. Fim bloqueia novas rolagens/movimentos.
 * - Entradas inválidas de rolar/mover lançam Error, preservando todo o estado.
 * - legais/casa são consultas para jogador/dado/progresso válidos, sem mutação.
 * - Fixtures tardias configuram somente posições válidas no estado público.
 * - Não se exige desenho de tabuleiro, bot ou multiplayer pela internet.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const { Ludo } = await import(process.env.MODULO_LUDO
  ? pathToFileURL(resolve(process.env.MODULO_LUDO)).href
  : new URL('./ludo.js',import.meta.url).href);
const SEGURAS=[0,8,13,21,26,34,39,47];
const foto=j=>structuredClone({peoes:j.peoes,turno:j.turno,dado:j.dado,seis:j.seis,vencedor:j.vencedor});
function rejeita(j,acao){const antes=foto(j);assert.throws(acao,Error);assert.deepEqual(foto(j),antes);}
function fixture(peoes,turno=0){const j=new Ludo();j.peoes=peoes.map(p=>[...p]);j.turno=turno;return j;}

test('duas equipes com quatro peões, todos na base, e jogador 0 começa',()=>{
  const j=new Ludo();assert.deepEqual(foto(j),{peoes:[[-1,-1,-1,-1],[-1,-1,-1,-1]],turno:0,dado:null,seis:0,vencedor:null});assert.notStrictEqual(j.peoes[0],j.peoes[1]);
});
for(const dado of [1,2,3,4,5]) test(`dado ${dado} com todos na base não permite movimento e passa automaticamente`,()=>{
  const j=new Ludo();assert.deepEqual(j.rolar(0,dado),[]);assert.equal(j.turno,1);assert.equal(j.dado,null);assert.equal(j.seis,0);assert.deepEqual(j.peoes,[[-1,-1,-1,-1],[-1,-1,-1,-1]]);
});
for(const jogador of [0,1]) test(`seis permite tirar qualquer um dos quatro peões do jogador ${jogador}`,()=>{
  for(let i=0;i<4;i++){const j=new Ludo();j.turno=jogador;assert.deepEqual(j.rolar(jogador,6),[0,1,2,3]);assert.equal(j.mover(jogador,i),0);assert.equal(j.peoes[jogador][i],0);assert.equal(j.peoes[jogador].filter(p=>p===-1).length,3);assert.equal(j.turno,jogador);assert.equal(j.dado,null);}
});
test('tabela exaustiva de legalidade: 59 posições possíveis por seis dados, sem modificar o jogo',()=>{
  for(let p=-1;p<=57;p++)for(let dado=1;dado<=6;dado++){
    const j=fixture([[p,57,57,57],[-1,-1,-1,-1]]),antes=foto(j);
    const pode=p===-1?dado===6:p<57&&p+dado<=57;assert.deepEqual(j.legais(0,dado),pode?[0]:[],`p=${p},dado=${dado}`);assert.deepEqual(foto(j),antes);
  }
});
test('mapeamento global é cíclico, tem 52 casas e separa entradas por 26',()=>{
  const j=new Ludo();for(const jogador of [0,1]){const casas=Array.from({length:52},(_,p)=>j.casa(jogador,p));assert.equal(new Set(casas).size,52);assert.deepEqual(casas,Array.from({length:52},(_,p)=>(p+jogador*26)%52));}assert.equal(j.casa(1,26),0);
});
for(const dado of [0,7,-1,1.5,'6',null,undefined,NaN,Infinity]) test(`rolagem inválida ${String(dado)} é rejeitada sem alteração`,()=>{const j=new Ludo();rejeita(j,()=>j.rolar(0,dado));});
for(const jogador of [-1,1,2,'0',null,0.5,NaN]) test(`jogador ${String(jogador)} não pode agir no turno de 0`,()=>{
  const j=new Ludo();rejeita(j,()=>j.rolar(jogador,6));j.rolar(0,6);rejeita(j,()=>j.mover(jogador,0));
});
test('não movimenta sem dado e não rola novamente enquanto falta escolher um peão',()=>{
  const j=new Ludo();rejeita(j,()=>j.mover(0,0));j.rolar(0,6);rejeita(j,()=>j.rolar(0,6));assert.equal(j.dado,6);
});
for(const i of [-1,4,0.5,'0',null,NaN]) test(`índice de peão inválido ${String(i)} não consome dado`,()=>{const j=new Ludo();j.rolar(0,6);rejeita(j,()=>j.mover(0,i));assert.equal(j.dado,6);});
for(const jogador of [0,1]) for(const dado of [1,2,3,4,5,6]) test(`jogador ${jogador} avança exatamente ${dado} em movimento comum`,()=>{
  const ps=[[-1,-1,-1,-1],[-1,-1,-1,-1]];ps[jogador][0]=10;const j=fixture(ps,jogador);assert.deepEqual(j.rolar(jogador,dado),dado===6?[0,1,2,3]:[0]);assert.equal(j.mover(jogador,0),10+dado);assert.equal(j.turno,dado===6?jogador:1-jogador);assert.equal(j.dado,null);
});
test('escolha de um peão não move os demais',()=>{const j=fixture([[0,10,20,30],[-1,-1,-1,-1]]);j.rolar(0,2);j.mover(0,2);assert.deepEqual(j.peoes[0],[0,10,22,30]);});
test('três seis: terceiro não move nenhum peão e não desfaz movimentos anteriores',()=>{
  const j=new Ludo();j.rolar(0,6);j.mover(0,0);j.rolar(0,6);j.mover(0,0);const pos=structuredClone(j.peoes);assert.deepEqual(j.rolar(0,6),[]);assert.deepEqual(j.peoes,pos);assert.equal(j.peoes[0][0],6);assert.equal(j.turno,1);assert.equal(j.dado,null);assert.equal(j.seis,0);
});
test('um não-seis quebra sequência; próximo turno não herda os seis anteriores',()=>{
  const j=fixture([[0,-1,-1,-1],[0,-1,-1,-1]]);j.rolar(0,6);j.mover(0,0);j.rolar(0,2);j.mover(0,0);assert.equal(j.seis,0);j.rolar(1,6);assert.equal(j.seis,1);j.mover(1,0);assert.equal(j.turno,1);
});
test('sem movimento mesmo com seis não acumula dado pendente e ainda concede outra rolagem',()=>{
  const j=fixture([[56,57,57,57],[-1,-1,-1,-1]]);assert.deepEqual(j.rolar(0,6),[]);assert.equal(j.turno,0);assert.equal(j.dado,null);assert.deepEqual(j.rolar(0,6),[]);assert.deepEqual(j.rolar(0,6),[]);assert.equal(j.turno,1);
});
for(const jogador of [0,1]) test(`captura na mesma casa global funciona para jogador ${jogador}`,()=>{
  const ps=[[-1,-1,-1,-1],[-1,-1,-1,-1]],destinoGlobal=5;ps[jogador][0]=(destinoGlobal-jogador*26+52)%52-1;ps[1-jogador][0]=(destinoGlobal-(1-jogador)*26+52)%52;
  const j=fixture(ps,jogador);j.rolar(jogador,1);j.mover(jogador,0);assert.equal(j.peoes[1-jogador][0],-1);assert.equal(j.turno,1-jogador);
});
test('captura devolve todos os peões rivais empilhados naquela casa',()=>{
  const j=fixture([[4,-1,-1,-1],[31,31,32,-1]]);j.rolar(0,1);j.mover(0,0);assert.deepEqual(j.peoes[1],[-1,-1,32,-1]);
});
for(const casa of SEGURAS) test(`casa global ${casa} é segura, inclusive entradas e voltas da pista`,()=>{
  // Para a casa zero, usa-se J1: seu progresso destino é 26, sem passar pela reta final.
  const jogador=casa===0?1:0,destino=(casa-jogador*26+52)%52,ps=[[-1,-1,-1,-1],[-1,-1,-1,-1]];
  ps[jogador][0]=destino-1;const rival=(casa-(1-jogador)*26+52)%52;ps[1-jogador][0]=rival;
  const j=fixture(ps,jogador);j.rolar(jogador,1);j.mover(jogador,0);assert.equal(j.peoes[1-jogador][0],rival);
});
test('passar por cima de adversário não captura e não cria barreira',()=>{
  const j=fixture([[4,-1,-1,-1],[31,31,-1,-1]]);j.rolar(0,2);j.mover(0,0);assert.deepEqual(j.peoes[1],[31,31,-1,-1]);assert.equal(j.peoes[0][0],6);
});
test('peões da mesma equipe podem compartilhar uma casa',()=>{const j=fixture([[4,5,-1,-1],[-1,-1,-1,-1]]);j.rolar(0,1);j.mover(0,0);assert.deepEqual(j.peoes[0],[5,5,-1,-1]);});
test('entrada na reta final não captura peça com coordenada modular coincidente',()=>{
  const j=fixture([[51,-1,-1,-1],[26,-1,-1,-1]]);j.rolar(0,1);assert.equal(j.mover(0,0),52);assert.equal(j.peoes[1][0],26);
});
test('peão rival na reta final não pode ser capturado pela pista compartilhada',()=>{
  const j=fixture([[25,-1,-1,-1],[52,-1,-1,-1]]);j.rolar(0,1);j.mover(0,0);assert.equal(j.peoes[1][0],52);
});
for(const p of [51,52,53,54,55,56]) test(`chegada por dado exato a partir de ${p}`,()=>{
  const j=fixture([[p,57,57,-1],[-1,-1,-1,-1]]),dado=57-p;j.rolar(0,dado);assert.equal(j.mover(0,0),57);assert.equal(j.vencedor,null);assert.equal(j.turno,dado===6?0:1);
});
test('excesso na chegada não rebate e não altera posição',()=>{
  const j=fixture([[56,57,57,57],[-1,-1,-1,-1]]);assert.deepEqual(j.rolar(0,2),[]);assert.equal(j.peoes[0][0],56);assert.equal(j.turno,1);assert.equal(j.dado,null);
});
test('peão finalizado não pode andar, mesmo com dado pendente para outro',()=>{const j=fixture([[57,4,-1,-1],[-1,-1,-1,-1]]);j.rolar(0,1);rejeita(j,()=>j.mover(0,0));});
for(const jogador of [0,1]) test(`quarto peão na chegada vence para jogador ${jogador} e bloqueia ações`,()=>{
  const ps=[[-1,-1,-1,-1],[-1,-1,-1,-1]];ps[jogador]=[57,57,57,56];const j=fixture(ps,jogador);j.rolar(jogador,1);j.mover(jogador,3);assert.equal(j.vencedor,jogador);assert.deepEqual(j.peoes[jogador],[57,57,57,57]);for(const p of [0,1]){rejeita(j,()=>j.rolar(p,6));rejeita(j,()=>j.mover(p,0));}
});
test('partida completa desde a base até vitória: quatro saídas, percurso e chegada exata',()=>{
  const j=new Ludo();let passos=0;
  while(j.vencedor===null&&passos++<600){const p=j.turno;if(p===1){assert.deepEqual(j.rolar(1,1),[]);continue;}
    const i=j.peoes[0].findIndex(v=>v<57),pos=j.peoes[0][i];
    // Planeja dados válidos: seis para sair, depois avanços de um (sem depender de sorte).
    j.rolar(0,pos===-1?6:1);j.mover(0,i);
  }
  assert.equal(j.vencedor,0);assert.deepEqual(j.peoes[0],[57,57,57,57]);assert.ok(passos<600);
});
test('partidas distintas não compartilham peões, dado ou placar',()=>{const a=new Ludo(),b=new Ludo();a.rolar(0,6);a.mover(0,0);assert.deepEqual(b.peoes,[[-1,-1,-1,-1],[-1,-1,-1,-1]]);assert.equal(b.dado,null);assert.equal(b.vencedor,null);});
