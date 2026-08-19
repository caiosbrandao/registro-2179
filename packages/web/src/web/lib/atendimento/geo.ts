/** Geocodificação reversa via Nominatim (OpenStreetMap). */

export interface EnderecoResolvido {
  cidadeUf: string;
  enderecoCompleto: string;
  cidade: string;
}

export function coordenadasValidas(valor: string): boolean {
  if (!valor || valor.includes("http")) return false;
  const partes = valor.replace(/\s/g, "").split(",");
  if (partes.length !== 2) return false;
  const [lat, lon] = partes.map(Number);
  return (
    Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180
  );
}

export function parseCoordenadas(valor: string): [number, number] | null {
  if (!coordenadasValidas(valor)) return null;
  const [lat, lon] = valor.replace(/\s/g, "").split(",").map(Number);
  return [lat, lon];
}

export async function resolverEndereco(
  coordenadas: string,
  signal?: AbortSignal,
): Promise<EnderecoResolvido | null> {
  const par = parseCoordenadas(coordenadas);
  if (!par) return null;
  const [lat, lon] = par;

  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&accept-language=pt-BR`;
  const resposta = await fetch(url, { signal, headers: { Accept: "application/json" } });
  if (!resposta.ok) throw new Error(`Nominatim ${resposta.status}`);

  const dados = (await resposta.json()) as { address?: Record<string, string> };
  const end = dados.address;
  if (!end) return null;

  const cidade = end.city || end.town || end.village || end.municipality || "";
  const uf = end["ISO3166-2-lvl4"] ? end["ISO3166-2-lvl4"].split("-")[1] : "";
  const rua = end.road || "";
  const bairro = end.suburb || end.neighbourhood || "";
  const numero = end.house_number || "S/N";
  const cep = end.postcode || "";

  const enderecoCompleto = `${rua}${rua ? ", " : ""}${numero}${bairro ? " - " : ""}${bairro}${
    cidade ? " - " : ""
  }${cidade}/${uf}${cep ? ` (CEP: ${cep})` : ""}`;

  return {
    cidade: cidade.toUpperCase(),
    cidadeUf: cidade ? `${cidade.toUpperCase()} / ${uf.toUpperCase()}` : "",
    enderecoCompleto: enderecoCompleto.toUpperCase(),
  };
}
