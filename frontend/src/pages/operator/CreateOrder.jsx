import { useState, useEffect } from 'react';
import { Box, Button, Field, Input, NativeSelect, Heading, Stack, Text } from '@chakra-ui/react';
import API from '../../services/api';

export default function CreateOrder() {
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState('');
  const [qty, setQty] = useState('');
  const [subtotal, setSubtotal] = useState(0);

  // Simulasi ambil data master harga dari backend
  useEffect(() => {
    // Di dunia nyata: API.get('/services').then(res => setServices(res.data))
    setServices([
      { id: 1, service_name: 'Cuci dan Gosok', price: 5000 },
      { id: 2, service_name: 'Hanya Cuci', price: 4500 },
      { id: 3, service_name: 'Hanya Gosok', price: 5000 },
      { id: 4, service_name: 'Laundry Besar (Selimut/Karpet)', price: 7000 },
    ]);
  }, []);

  // Hitung subtotal otomatis ketika jenis jasa atau qty berubah
  useEffect(() => {
    const service = services.find(s => s.id === parseInt(selectedService));
    if (service && qty) {
      setSubtotal(service.price * parseFloat(qty));
    } else {
      setSubtotal(0);
    }
  }, [selectedService, qty, services]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Logika pengiriman data JSON ke backend Express
    console.log({ id_service: selectedService, qty, subtotal });
  };

  return (
    <Box maxW="500px" mx="auto" mt="8" p="6" borderWidth="1px" borderRadius="lg" boxShadow="md">
      <Heading size="md" mb="6">Transaksi Laundry Baru</Heading>
      
      <form onSubmit={handleSubmit}>
        <Stack gap="4">
          <Field.Root required>
            <Field.Label>Pilih Jenis Jasa</Field.Label>
            <NativeSelect.Root>
              <NativeSelect.Field 
                placeholder="-- Pilih Layanan --"
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
              >
                {services.map(s => (
                  <option key={s.id} value={s.id}>{s.service_name} (Rp {s.price}/kg)</option>
                ))}
              </NativeSelect.Field>
            </NativeSelect.Root>
          </Field.Root>

          <Field.Root required>
            <Field.Label>Berat Pakaian (Qty/Kg)</Field.Label>
            <Input 
              type="number" 
              step="0.1" 
              placeholder="Contoh: 3.5" 
              value={qty}
              onChange={(e) => setQty(e.target.value)}
            />
          </Field.Root>

          <Box p="4" bg="gray.50" borderRadius="md" borderWidth="1px">
            <Text fontWeight="bold">Estimasi Subtotal:</Text>
            <Text fontSize="2xl" color="blue.600" fontWeight="extrabold">
              Rp {subtotal.toLocaleString('id-ID')}
            </Text>
          </Box>

          <Button type="submit" colorScheme="blue" width="full">
            Simpan Transaksi
          </Button>
        </Stack>
      </form>
    </Box>
  );
}