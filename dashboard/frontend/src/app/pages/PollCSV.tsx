import { useState } from 'react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Switch } from '../components/ui/switch';
import { mockServers } from '../data/mockData';
import { Upload, FileSpreadsheet, Download, AlertCircle, CheckCircle, Send } from 'lucide-react';
import { toast } from 'sonner';

export function PollCSV() {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.name.endsWith('.csv')) {
        setCsvFile(file);
        // Simular parse do CSV
        setTimeout(() => {
          setParsedData({
            title: 'Escolha da próxima leitura do clube',
            description: 'Votação importada por CSV para definir o próximo livro.',
            options: [{ text: '1984' }, { text: 'Dom Casmurro' }, { text: 'Duna' }, { text: 'A Revolução dos Bichos' }],
          });
          toast.success('Arquivo CSV processado com sucesso!');
        }, 1000);
      } else {
        toast.error('Por favor, selecione um arquivo .csv válido');
      }
    }
  };

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Enquete criada e publicada com sucesso!');
    setCsvFile(null);
    setParsedData(null);
  };

  const downloadTemplate = () => {
    const csvContent = `nome-da-enquete;opcoes;max_votos;peso_mensalistas
Qual livro vamos ler em maio?;1984|Duna|Dom Casmurro|Capitães da Areia;2;sim`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template-clube-do-livro.csv';
    a.click();
    toast.success('Template baixado com sucesso!');
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl mb-2 dark:text-white">Votações em CSV</h1>
        <p className="text-gray-600 dark:text-gray-400">Crie votações do clube do livro importando um arquivo CSV</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-4 md:mb-6">
        <Card className="p-4 md:p-6 lg:col-span-2 dark:bg-gray-800 dark:border-gray-700">
          <div className="mb-4 md:mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
              <h2 className="text-lg md:text-xl dark:text-white">Importar Arquivo CSV</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadTemplate}
                className="dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700 w-full sm:w-auto"
              >
                <Download className="size-4 mr-2" />
                Baixar Template
              </Button>
            </div>

            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 md:p-8 text-center hover:border-[#5865F2] dark:hover:border-[#5865F2] transition-colors">
              <input type="file" id="csv-upload" accept=".csv" onChange={handleFileChange} className="hidden" />
              <label htmlFor="csv-upload" className="cursor-pointer">
                {csvFile ? (
                  <div className="space-y-3">
                    <CheckCircle className="size-10 md:size-12 text-green-600 dark:text-green-400 mx-auto" />
                    <p className="font-medium text-green-700 dark:text-green-400 text-sm md:text-base truncate px-4">
                      {csvFile.name}
                    </p>
                    <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Arquivo carregado com sucesso</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                    >
                      Trocar Arquivo
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Upload className="size-10 md:size-12 text-gray-400 dark:text-gray-500 mx-auto" />
                    <p className="font-medium text-sm md:text-base dark:text-white">
                      Clique para selecionar ou arraste o arquivo CSV
                    </p>
                    <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                      Apenas arquivos .csv são aceitos
                    </p>
                  </div>
                )}
              </label>
            </div>
          </div>

          {parsedData && (
            <div className="space-y-4 md:space-y-6">
              <div className="p-3 md:p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700/50 rounded-lg flex items-start gap-3">
                <CheckCircle className="size-5 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-green-800 dark:text-green-300 text-sm md:text-base">
                    Arquivo processado
                  </p>
                  <p className="text-xs md:text-sm text-green-700 dark:text-green-400">
                    {parsedData.options.length} opções encontradas
                  </p>
                </div>
              </div>

              <form onSubmit={handlePublish} className="space-y-4 md:space-y-6">
                <div>
                  <Label htmlFor="csv-title" className="dark:text-gray-200">
                    Título *
                  </Label>
                  <Input
                    id="csv-title"
                    defaultValue={parsedData.title}
                    required
                    className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="csv-description" className="dark:text-gray-200">
                    Descrição
                  </Label>
                  <Textarea
                    id="csv-description"
                    defaultValue={parsedData.description}
                    className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="csv-server" className="dark:text-gray-200">
                      Servidor *
                    </Label>
                    <Select required>
                      <SelectTrigger className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                        <SelectValue placeholder="Selecione um servidor" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockServers.map((server) => (
                          <SelectItem key={server.id} value={server.id}>
                            {server.icon} {server.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="csv-channel" className="dark:text-gray-200">
                      Canal *
                    </Label>
                    <Select required>
                      <SelectTrigger className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                        <SelectValue placeholder="Selecione um canal" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general"># general</SelectItem>
                        <SelectItem value="eventos"># eventos</SelectItem>
                        <SelectItem value="votacao"># votação</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="dark:text-gray-200">Opções Importadas</Label>
                  <div className="mt-2 space-y-2">
                    {parsedData.options.map((opt: any, index: number) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                      >
                        <span className="dark:text-white text-sm md:text-base">{opt.text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="csv-duration" className="dark:text-gray-200">
                    Duração
                  </Label>
                  <Select defaultValue="24h">
                    <SelectTrigger className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1h">1 hora</SelectItem>
                      <SelectItem value="6h">6 horas</SelectItem>
                      <SelectItem value="12h">12 horas</SelectItem>
                      <SelectItem value="24h">24 horas</SelectItem>
                      <SelectItem value="3d">3 dias</SelectItem>
                      <SelectItem value="7d">7 dias</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 md:p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg gap-4">
                    <div className="flex-1">
                      <Label htmlFor="csv-multiple" className="dark:text-gray-200">
                        Múltipla Escolha
                      </Label>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Permitir que usuários selecionem várias opções
                      </p>
                    </div>
                    <Switch id="csv-multiple" />
                  </div>

                  <div className="flex items-center justify-between p-3 md:p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg gap-4">
                    <div className="flex-1">
                      <Label htmlFor="csv-anonymous" className="dark:text-gray-200">
                        Votação Anônima
                      </Label>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Ocultar quem votou em cada opção</p>
                    </div>
                    <Switch id="csv-anonymous" />
                  </div>
                </div>

                <Button type="submit" className="w-full bg-[#5865F2] hover:bg-[#4752C4]">
                  <Send className="size-4 mr-2" />
                  Publicar Enquete
                </Button>
              </form>
            </div>
          )}
        </Card>

        <div className="space-y-4 md:space-y-6">
          <Card className="p-4 md:p-6 dark:bg-gray-800 dark:border-gray-700">
            <h3 className="mb-4 flex items-center gap-2 dark:text-white text-base md:text-lg">
              <FileSpreadsheet className="size-5" />
              Formato do CSV
            </h3>
            <div className="space-y-3 text-sm">
              <p className="text-gray-600 dark:text-gray-400">O arquivo CSV deve conter as seguintes colunas:</p>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-[#5865F2]">•</span>
                  <span>
                    <strong>nome-da-enquete</strong>: Nome da votação
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#5865F2]">•</span>
                  <span>
                    <strong>opcoes</strong> (ou <strong>opções</strong>): Lista de opções de leitura
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#5865F2]">•</span>
                  <span>
                    <strong>max_votos</strong> (ou <strong>maxVotos</strong>): Máximo de votos por pessoa
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#5865F2]">•</span>
                  <span>
                    <strong>peso_mensalistas</strong>: Use <strong>sim</strong> ou <strong>nao</strong>
                  </span>
                </li>
              </ul>
            </div>
          </Card>

          <Card className="p-4 md:p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700/50">
            <div className="flex items-start gap-3">
              <AlertCircle className="size-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
              <div className="space-y-2 text-sm">
                <p className="font-medium text-blue-900 dark:text-blue-300">Dicas importantes</p>
                <ul className="space-y-1 text-blue-800 dark:text-blue-400">
                  <li>• Use ; para separar colunas do CSV</li>
                  <li>• Separe opções com vírgula, barra (/) ou pipe (|)</li>
                  <li>• Máximo de 20 opções por enquete</li>
                  <li>• Codificação UTF-8 recomendada</li>
                  <li>• Baixe o template para facilitar</li>
                </ul>
              </div>
            </div>
          </Card>

          <Card className="p-4 md:p-6 dark:bg-gray-800 dark:border-gray-700">
            <h3 className="mb-4 dark:text-white">Exemplo de CSV</h3>
            <pre className="text-xs bg-gray-900 text-green-400 p-3 md:p-4 rounded overflow-x-auto">
              {`nome-da-enquete;opcoes;max_votos;peso_mensalistas
Qual livro vamos ler no próximo mês?;Duna|1984|Dom Casmurro;2;sim`}
            </pre>
          </Card>
        </div>
      </div>
    </div>
  );
}
