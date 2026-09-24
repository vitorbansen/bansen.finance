import { ImageResponse } from "next/og";

const VERDE = "linear-gradient(145deg, #34C759 0%, #248A3D 100%)";

/**
 * Ícone do app: "R$" branco sobre verde. `maskable` deixa margem de segurança (80%) porque
 * o Android recorta em círculo; o iOS aplica o próprio arredondamento.
 */
export function imagemIcone(tamanho: number, { maskable = false } = {}) {
  const fonte = Math.round(tamanho * (maskable ? 0.34 : 0.42));
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: VERDE,
          color: "white",
          fontSize: fonte,
          fontWeight: 700,
          letterSpacing: -fonte * 0.04,
        }}
      >
        R$
      </div>
    ),
    { width: tamanho, height: tamanho },
  );
}

/** Splash da Tela de Início: fundo claro do sistema com o ícone no centro. */
export function imagemSplash(largura: number, altura: number) {
  const lado = Math.round(Math.min(largura, altura) * 0.22);
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#F2F2F7",
        }}
      >
        <div
          style={{
            width: lado,
            height: lado,
            borderRadius: lado * 0.225,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: VERDE,
            color: "white",
            fontSize: lado * 0.42,
            fontWeight: 700,
          }}
        >
          R$
        </div>
        <div style={{ marginTop: lado * 0.25, fontSize: lado * 0.2, color: "#1C1C1E", fontWeight: 600 }}>Finanças</div>
      </div>
    ),
    { width: largura, height: altura },
  );
}
