import React, { useState } from 'react';
import {
  Flex,
  FormButtonInput,
  FormInputArea,
  FormLabel,
  FormNumberInput,
  FormTextInput,
  Grid,
} from '../../utils/styles';
import { FaPlusCircle } from 'react-icons/fa';
import { IoTrashOutline } from 'react-icons/io5';

interface FormData {
  titulo: string;
  opcoes: string[];
  maxVotos: number;
  mensalista: boolean;
}

const AppCreateForm: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    titulo: '',
    opcoes: ['', ''],
    maxVotos: 1,
    mensalista: false,
  });

  const handleTituloChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, titulo: e.target.value });
  };

  const handleOpcaoChange = (index: number, value: string) => {
    const newOpts = [...formData.opcoes];
    newOpts[index] = value;
    setFormData({ ...formData, opcoes: newOpts });
  };

  const addOptField = () => {
    setFormData({ ...formData, opcoes: [...formData.opcoes, ''] });
  };

  const rmvOptField = (index: number) => {
    if (formData.opcoes.length > 1) {
      const newOpts = formData.opcoes.filter((_, i) => i !== index);
      setFormData({ ...formData, opcoes: newOpts });
    }
  };

  const handleMaxVotosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = Number(e.target.value);
    if (valor >= 1 && valor <= 4) {
      setFormData({ ...formData, maxVotos: valor });
    }
  };

  const handleMensalistaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, mensalista: e.target.checked });
  };

  const outputJSON = () => {
    const dadosFinais = {
      ...formData,
      opcoes: formData.opcoes.filter((op) => op.trim() !== ''),
    };
    alert(JSON.stringify(dadosFinais, null, 2));
  };

  return (
    <div style={{ maxWidth: '840px' }}>
      <FormInputArea>
        <FormLabel id="titulo">Título:</FormLabel>
        <FormTextInput
          type="text"
          id="titulo"
          value={formData.titulo}
          style={{ width: '800px' }}
          onChange={handleTituloChange}
          placeholder="Digite o título da votação"
        />
      </FormInputArea>

      <FormInputArea>
        <FormLabel>Opções:</FormLabel>
        {formData.opcoes.map((opcao, index) => (
          <div key={index} style={{ display: 'flex', gap: '5px', marginBottom: '5px' }}>
            <FormTextInput
              type="text"
              value={opcao}
              onChange={(e) => handleOpcaoChange(index, e.target.value)}
              style={{ flex: 1 }}
              placeholder={`Opção ${index + 1}`}
            />
            {formData.opcoes.length > 1 && (
              <button
                type="button"
                onClick={() => rmvOptField(index)}
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#424549',
                  color: 'white',
                  border: '1px solid red',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                <IoTrashOutline color="red" size={30} />
              </button>
            )}
          </div>
        ))}
        <Grid gridTemplateColumns="1fr" alignItems="center" justifyContent="space-evenly" style={{ width: '800px' }}>
          <Flex justifyContent="space-evenly" style={{ padding: '16px 0' }}>
            <div onClick={addOptField} style={{ cursor: 'pointer' }}>
              <FaPlusCircle color="#7289da" size={45} />
            </div>
          </Flex>
        </Grid>
      </FormInputArea>

      <FormInputArea>
        <FormLabel id="maxVotos">Máximo de votos simultâneos:</FormLabel>
        <FormNumberInput
          type="number"
          id="maxVotos"
          value={formData.maxVotos}
          onChange={handleMaxVotosChange}
          min={1}
          max={4}
          step={1}
        />
      </FormInputArea>

      <FormInputArea>
        <FormLabel style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <input type="checkbox" checked={formData.mensalista} onChange={handleMensalistaChange} />
          <span>Mensalista (peso diferenciado)</span>
        </FormLabel>
      </FormInputArea>

      <div>
        <FormButtonInput onClick={outputJSON}>Gerar JSON</FormButtonInput>
      </div>
    </div>
  );
};

export default AppCreateForm;
