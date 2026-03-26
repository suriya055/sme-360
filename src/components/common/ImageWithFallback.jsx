import React, { useState } from 'react';
import { Image, Box, Center, Icon } from '@chakra-ui/react';
import { Package } from 'lucide-react';

const ImageWithFallback = ({ src, alt, fallbackSrc, ...props }) => {
    const [error, setError] = useState(false);

    // dynamically fix localhost URLs stored by the WA Bot if accessing from another device
    const apiUrl = import.meta.env.VITE_API_URL || '/api';
    const baseUrl = apiUrl === '/api' ? '' : apiUrl.replace(/\/api$/, '');

    let displaySrc = src;
    if (src && src.startsWith('/uploads')) {
        displaySrc = `${baseUrl}${src}`;
    } else if (src && src.includes('localhost:5000/uploads')) {
        // [FIX] In production, replace any leftover 'localhost:5000' with the current origin baseUrl
        displaySrc = src.replace(/^https?:\/\/localhost:5000/, baseUrl);
    }

    const handleError = () => {
        setError(true);
    };

    if (error || !displaySrc) {
        return (
            <Box
                bg="gray.100"
                borderRadius="md"
                display="flex"
                alignItems="center"
                justifyContent="center"
                {...props}
            >
                <Center w="100%" h="100%">
                    <Icon as={Package} w={8} h={8} color="gray.400" />
                </Center>
            </Box>
        );
    }

    return (
        <Image
            src={displaySrc}
            alt={alt}
            onError={handleError}
            objectFit="cover"
            {...props}
        />
    );
};

export default ImageWithFallback;
