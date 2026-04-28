# GroovePad — guia rápido

Este guia explica o que cada controlo faz na app web.

## Ecrãs

### Drums

Grelha de 16 pads de bateria/percussão. Toca num pad para disparar som. Se estiveres a gravar, cada toque fica guardado no groove.

### Melody

Grelha de 16 pads melódicos. Funciona como Drums, mas para notas ou samples melódicos.

### Library

Lista grooves guardados na nuvem. Toca num groove para carregar BPM, eventos e, quando existir, o pack usado na gravação.

## Pack

O selector **Pack** muda o conjunto de sons/labels/cores dos pads.

- **Classic Synth** usa sons procedurais leves gerados no browser.
- **Club Neon** usa alguns samples WAV de demonstração e fallbacks procedurais.

Ao mudar de pack, a app também muda o BPM para o BPM sugerido desse pack. Grooves novos guardam o `pack_id`, para a Library conseguir reabrir o pack certo.

Se aparecer uma mensagem do tipo **A carregar samples...**, espera um momento: a app está a carregar WAV/OGG do pack ativo.

## Transporte

### Apenas local

Liga/desliga o modo local.

- Ligado: não usa a nuvem; **Save cloud** e **Library** ficam desativados.
- Desligado: permite guardar e carregar grooves pela API, se houver ligação.

### BPM

Define a velocidade do groove. Vai de 60 a 200 BPM. Afeta metrónomo e playback do loop.

### Metronome / Metronome off

Liga ou desliga o clique do metrónomo no BPM atual.

### Record / Stop rec

Começa ou termina uma gravação.

Fluxo normal:

1. Carrega em **Record**.
2. Toca pads em Drums ou Melody.
3. Carrega em **Stop rec**.

Ao começar uma nova gravação, os eventos anteriores são limpos.

### Play loop / Stop loop

Toca em loop o groove gravado.

- Só fica ativo depois de existirem eventos gravados.
- Usa o BPM atual.
- O tamanho do loop é calculado para caber o último evento, com base em compassos.

### Clear

Limpa os eventos gravados e pára o loop. Não apaga grooves já guardados na nuvem.

### Stop all

Pára loop, metrónomo e corta o som ativo. Não limpa o groove gravado.

### Save cloud

Guarda o groove atual na API/nuvem.

O que guarda:

- BPM
- eventos gravados
- tamanho do loop
- pack ativo (`pack_id`)

Depois de guardar, aparece **Saved.**. O groove passa a aparecer em **Library**.

## Mensagens

### Sem ligação ao servidor

A app não conseguiu falar com a API. Pads e loops continuam a funcionar, mas guardar/carregar da nuvem pode falhar.

### Sem VITE_API_URL

A app foi aberta sem URL de API configurado. Funciona como áudio local, mas **Save cloud** e **Library** não ficam completos.

### Saved.

O groove foi guardado com sucesso na API.

## Teste rápido

1. Abre a app.
2. Escolhe um pack.
3. Toca pads em Drums.
4. Carrega em **Record**.
5. Toca mais pads.
6. Carrega em **Stop rec**.
7. Carrega em **Play loop**.
8. Carrega em **Save cloud**.
9. Abre **Library** e confirma que o groove aparece.
