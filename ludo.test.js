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
