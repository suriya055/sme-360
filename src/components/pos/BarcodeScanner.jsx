import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
    Box, Text, VStack, Alert, AlertIcon, AlertDescription,
    HStack, Badge, Button, Input, InputGroup, InputLeftElement
} from '@chakra-ui/react';
import { Scan, Hash } from 'lucide-react';
import api from '../../services/api';

/**
 * [FEATURE #5] BarcodeScanner Component
 * - Uses html5-qrcode library for camera-based scanning (lazy loaded)
 * - Falls back to manual SKU/barcode text entry
 * - Calls GET /products/barcode/:code and returns found product via onProductFound callback
 */
const BarcodeScanner = ({ onProductFound, onError }) => {
    const scannerRef = useRef(null);
    const html5QrCodeRef = useRef(null);
    const [isScanning, setIsScanning] = useState(false);
    const [manualCode, setManualCode] = useState('');
    const [scanError, setScanError] = useState(null);
    const [lastScanned, setLastScanned] = useState(null);

    const lookupBarcode = useCallback(async (code) => {
        setScanError(null);
        try {
            // api baseURL is already `/api` (or an absolute URL that already includes `/api`)
            const { data } = await api.get(`/products/barcode/${encodeURIComponent(code)}`);
            setLastScanned({ code, name: data.name });
            onProductFound(data);
        } catch (err) {
            const msg = err?.response?.status === 404
                ? `No product found for: ${code}`
                : 'Error looking up barcode. Try again.';
            setScanError(msg);
            if (onError) onError(msg);
        }
    }, [onProductFound, onError]);

    useEffect(() => {
        let scanner;

        const startScanner = async () => {
            try {
                // Dynamically import to avoid SSR and bundle bloat
                const { Html5Qrcode } = await import('html5-qrcode');
                scanner = new Html5Qrcode('barcode-scanner-element');
                html5QrCodeRef.current = scanner;

                await scanner.start(
                    { facingMode: 'environment' },
                    { fps: 10, qrbox: { width: 250, height: 150 } },
                    (decodedText) => {
                        lookupBarcode(decodedText.trim());
                    },
                    () => { } // Silent failure on no-decode frames
                );
                setIsScanning(true);
            } catch (err) {
                setScanError('Camera not available. Use manual entry below.');
                setIsScanning(false);
            }
        };

        startScanner();

        return () => {
            if (html5QrCodeRef.current) {
                html5QrCodeRef.current.stop().catch(() => { });
            }
        };
    }, [lookupBarcode]);

    const handleManualSubmit = (e) => {
        e.preventDefault();
        if (manualCode.trim()) {
            lookupBarcode(manualCode.trim().toUpperCase());
            setManualCode('');
        }
    };

    return (
        <VStack spacing={4} align="stretch">
            {/* Camera viewfinder */}
            <Box
                ref={scannerRef}
                id="barcode-scanner-element"
                borderRadius="xl"
                overflow="hidden"
                border="2px solid"
                borderColor="brand.300"
                bg="gray.900"
                minH="200px"
                position="relative"
            >
                {!isScanning && !scanError && (
                    <Box position="absolute" inset={0} display="flex" alignItems="center" justifyContent="center" color="gray.400">
                        <VStack>
                            <Scan size={32} />
                            <Text fontSize="sm">Starting camera...</Text>
                        </VStack>
                    </Box>
                )}
            </Box>

            {/* Last Scanned */}
            {lastScanned && (
                <Alert status="success" borderRadius="lg" py={2}>
                    <AlertIcon />
                    <AlertDescription fontSize="sm">
                        Found: <strong>{lastScanned.name}</strong> ({lastScanned.code}) — added to cart!
                    </AlertDescription>
                </Alert>
            )}

            {/* Error */}
            {scanError && (
                <Alert status="warning" borderRadius="lg" py={2}>
                    <AlertIcon />
                    <AlertDescription fontSize="sm">{scanError}</AlertDescription>
                </Alert>
            )}

            {/* Manual entry fallback */}
            <Box>
                <Text fontSize="xs" color="gray.500" mb={2} fontWeight="600" textTransform="uppercase" letterSpacing="wide">
                    Or enter SKU / barcode manually
                </Text>
                <form onSubmit={handleManualSubmit}>
                    <HStack>
                        <InputGroup size="md" flex={1}>
                            <InputLeftElement><Hash size={16} /></InputLeftElement>
                            <Input
                                value={manualCode}
                                onChange={e => setManualCode(e.target.value)}
                                placeholder="SKU or barcode..."
                                borderRadius="xl"
                                bg="gray.50"
                                autoComplete="off"
                            />
                        </InputGroup>
                        <Button type="submit" colorScheme="brand" borderRadius="xl" size="md">Look up</Button>
                    </HStack>
                </form>
            </Box>

            <HStack justify="center" spacing={2}>
                <Badge colorScheme={isScanning ? 'green' : 'orange'} borderRadius="full" px={3} py={1}>
                    {isScanning ? '● Scanning' : '○ Camera Off'}
                </Badge>
            </HStack>
        </VStack>
    );
};

export default BarcodeScanner;
