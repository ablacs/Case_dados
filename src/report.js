export function buildReportRow(user, metrics, status) {
  return {
    id: user.id,
    nome: user.name,
    quantidadePosts: metrics.postCount,
    mediaCaracteres: Number(metrics.avgChars.toFixed(2)),
    mediaComentarios: Number(metrics.avgComments.toFixed(2)),
    status,
  };
}

export function toCSV(rows) {
  const headers = [
    "ID",
    "Nome",
    "Quantidade de Posts",
    "Media de Caracteres",
    "Media de Comentarios",
    "Status",
  ];
  const lines = [headers.join(",")];

  rows.forEach((row) => {
    const nomeEscapado = `"${row.nome.replace(/"/g, '""')}"`;
    const line = [
      row.id,
      nomeEscapado,
      row.quantidadePosts,
      row.mediaCaracteres,
      row.mediaComentarios,
      row.status,
    ].join(",");
    lines.push(line);
  });

  return lines.join("\n");
}

export function downloadCSV(filename, csvContent) {
  const blob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
