import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  fonts: {
    heading: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    body: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: '"JetBrains Mono", "Fira Code", monospace',
  },
  config: {
    initialColorMode: 'light',
    useSystemColorMode: false,
    cssVarPrefix: 'sb',
  },
  colors: {
    brand: {
      50: '#eef2ff',
      100: '#e0e7ff',
      200: '#c7d2fe',
      300: '#a5b4fc',
      400: '#818cf8',
      500: '#6366f1',
      600: '#4f46e5',
      700: '#4338ca',
      800: '#3730a3',
      900: '#312e81',
    },
    accent: {
      50: '#fdf4ff',
      100: '#fae8ff',
      200: '#f5d0fe',
      300: '#f0abfc',
      400: '#e879f9',
      500: '#d946ef',
      600: '#c026d3',
      700: '#a21caf',
      800: '#86198f',
      900: '#701a75',
    },
    success: {
      50: '#ecfdf5',
      100: '#d1fae5',
      200: '#a7f3d0',
      300: '#6ee7b7',
      400: '#34d399',
      500: '#10b981',
      600: '#059669',
      700: '#047857',
      800: '#065f46',
      900: '#064e3b',
    },
    danger: {
      50: '#fff1f2',
      100: '#ffe4e6',
      200: '#fecdd3',
      300: '#fda4af',
      400: '#fb7185',
      500: '#f43f5e',
      600: '#e11d48',
      700: '#be123c',
      800: '#9f1239',
      900: '#881337',
    },
    neutral: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#e5e5e5',
      300: '#d4d4d4',
      400: '#a3a3a3',
      500: '#737373',
      600: '#525252',
      700: '#404040',
      800: '#262626',
      900: '#171717',
    },
    purple: {
      50: '#faf5ff',
      100: '#f3e8ff',
      200: '#e9d5ff',
      300: '#d8b4fe',
      400: '#c084fc',
      500: '#a855f7',
      600: '#9333ea',
      700: '#7e22ce',
      800: '#6b21a8',
      900: '#581c87',
    },
    indigo: {
      50: '#eef2ff',
      100: '#e0e7ff',
      200: '#c7d2fe',
      300: '#a5b4fc',
      400: '#818cf8',
      500: '#6366f1',
      600: '#4f46e5',
      700: '#4338ca',
      800: '#3730a3',
      900: '#312e81',
    },
    chart: {
      1: '#3b82f6',  // Blue
      2: '#10b981',  // Green
      3: '#f59e0b',  // Amber
      4: '#8b5cf6',  // Purple
      5: '#ef4444',  // Red
      6: '#ec4899',  // Pink
      7: '#06b6d4',  // Cyan
      8: '#84cc16',  // Lime
    },
  },
  shadows: {
    xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
    outline: '0 0 0 3px rgba(59, 130, 246, 0.5)',
    card: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    'card-hover': '0 4px 20px 0 rgba(0, 0, 0, 0.12), 0 7px 10px -5px rgba(0, 0, 0, 0.04)',
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: '600',
        borderRadius: 'lg',
        transition: 'all 0.2s',
        _focus: {
          boxShadow: 'outline',
        },
      },
      variants: {
        solid: (props) => ({
          bg: props.colorScheme === 'brand' ? 'brand.600' : undefined,
          color: 'white',
          _hover: {
            bg: props.colorScheme === 'brand' ? 'brand.700' : undefined,
            transform: 'translateY(-2px)',
            boxShadow: 'lg',
          },
          _active: {
            transform: 'translateY(0)',
          },
        }),
        outline: {
          border: '2px solid',
          borderColor: 'brand.600',
          color: 'brand.600',
          _hover: {
            bg: 'brand.50',
            transform: 'translateY(-2px)',
            boxShadow: 'md',
          },
        },
        ghost: {
          _hover: {
            bg: 'blackAlpha.100',
            transform: 'translateY(-2px)',
          },
        },
        gradient: {
          bgGradient: 'linear(to-r, brand.500, brand.600)',
          color: 'white',
          _hover: {
            bgGradient: 'linear(to-r, brand.600, brand.700)',
            transform: 'translateY(-2px)',
            boxShadow: 'lg',
          },
        },
      },
      sizes: {
        xl: {
          h: 14,
          fontSize: 'lg',
          px: 8,
        },
      },
      defaultProps: {
        colorScheme: 'brand',
      },
    },
    Card: {
      baseStyle: {
        container: {
          borderRadius: 'xl',
          boxShadow: 'sm',
          border: '1px solid',
          borderColor: 'neutral.200',
          transition: 'all 0.3s ease-in-out',
          overflow: 'hidden',
          _hover: {
            boxShadow: 'md',
            borderColor: 'neutral.300',
          },
        },
        header: {
          pb: 2,
        },
        body: {
          py: 6,
        },
        footer: {
          pt: 2,
        },
      },
      variants: {
        elevated: {
          container: {
            boxShadow: 'xl',
            border: 'none',
          },
        },
        gradient: {
          container: {
            bgGradient: 'linear(to-br, brand.50, white)',
            border: 'none',
          },
        },
        outline: {
          container: {
            border: '2px solid',
            borderColor: 'brand.200',
            boxShadow: 'none',
          },
        },
      },
    },
    Input: {
      baseStyle: {
        field: {
          borderRadius: 'lg',
          border: '1px solid',
          borderColor: 'neutral.300',
          _focus: {
            borderColor: 'brand.500',
            boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)',
          },
          _hover: {
            borderColor: 'neutral.400',
          },
        },
      },
      sizes: {
        lg: {
          field: {
            fontSize: 'md',
            px: 4,
            h: 14,
          },
        },
      },
    },
    Select: {
      baseStyle: {
        field: {
          borderRadius: 'lg',
          border: '1px solid',
          borderColor: 'neutral.300',
          _focus: {
            borderColor: 'brand.500',
            boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)',
          },
        },
      },
    },
    Table: {
      variants: {
        simple: {
          th: {
            borderBottom: '1px solid',
            borderColor: 'neutral.200',
            fontWeight: '600',
            textTransform: 'uppercase',
            fontSize: 'xs',
            color: 'neutral.600',
            letterSpacing: 'wider',
          },
          td: {
            borderBottom: '1px solid',
            borderColor: 'neutral.100',
          },
          tr: {
            _hover: {
              bg: 'neutral.50',
            },
          },
        },
        striped: {
          th: {
            borderBottom: '1px solid',
            borderColor: 'neutral.200',
            fontWeight: '600',
          },
          tbody: {
            tr: {
              _even: {
                bg: 'neutral.50',
              },
              _hover: {
                bg: 'brand.50',
              },
            },
          },
        },
      },
    },
    Badge: {
      baseStyle: {
        borderRadius: 'full',
        px: 2.5,
        py: 0.5,
        textTransform: 'none',
        fontWeight: '600',
        fontSize: 'xs',
      },
      variants: {
        subtle: (props) => ({
          bg: `${props.colorScheme}.100`,
          color: `${props.colorScheme}.800`,
        }),
        solid: (props) => ({
          bg: `${props.colorScheme}.600`,
          color: 'white',
        }),
        outline: (props) => ({
          border: '1px solid',
          borderColor: `${props.colorScheme}.300`,
          color: `${props.colorScheme}.700`,
        }),
      },
    },
    Progress: {
      baseStyle: {
        track: {
          borderRadius: 'full',
        },
        filledTrack: {
          borderRadius: 'full',
        },
      },
    },
    Modal: {
      baseStyle: {
        dialog: {
          borderRadius: '2xl',
          boxShadow: '2xl',
        },
        header: {
          fontWeight: '700',
        },
        closeButton: {
          borderRadius: 'full',
          _hover: {
            bg: 'neutral.100',
          },
        },
      },
    },
    Alert: {
      variants: {
        subtle: (props) => ({
          container: {
            bg: `${props.colorScheme}.50`,
            borderRadius: 'lg',
          },
          icon: {
            color: `${props.colorScheme}.600`,
          },
        }),
      },
    },
  },
  styles: {
    global: (props) => ({
      'html, body': {
        bg: 'neutral.50',
        color: 'neutral.800',
        fontFeatureSettings: '"cv11", "ss01"',
        fontVariationSettings: '"opsz" 32',
        scrollBehavior: 'smooth',
        overflowX: 'hidden',
      },
      '::-webkit-scrollbar': {
        width: '10px',
        height: '10px',
      },
      '::-webkit-scrollbar-track': {
        bg: 'neutral.100',
        borderRadius: 'full',
      },
      '::-webkit-scrollbar-thumb': {
        bg: 'neutral.400',
        borderRadius: 'full',
        '&:hover': {
          bg: 'neutral.500',
        },
      },
      '::selection': {
        bg: 'brand.500',
        color: 'white',
      },
      '.glass': {
        backdropFilter: 'blur(16px) saturate(180%)',
        backgroundColor: 'rgba(255, 255, 255, 0.75)',
        border: '1px solid rgba(255, 255, 255, 0.125)',
      },
      '.chart-grid': {
        stroke: props.colorMode === 'light' ? '#e5e5e5' : '#404040',
      },
      '.chart-tooltip': {
        borderRadius: 'lg',
        bg: 'white',
        boxShadow: 'xl',
        border: '1px solid',
        borderColor: 'neutral.200',
        color: 'neutral.700',
      },
    }),
  },
  layerStyles: {
    cardGradient: {
      bgGradient: 'linear(to-br, brand.50, purple.50)',
      border: '1px solid',
      borderColor: 'brand.100',
    },
    glass: {
      backdropFilter: 'blur(16px) saturate(180%)',
      backgroundColor: 'rgba(255, 255, 255, 0.75)',
      border: '1px solid rgba(255, 255, 255, 0.125)',
    },
    cardHover: {
      transform: 'translateY(-4px)',
      boxShadow: 'xl',
      transition: 'all 0.3s ease-in-out',
    },
  },
  textStyles: {
    heading: {
      fontWeight: '700',
      letterSpacing: '-0.025em',
    },
    subtitle: {
      fontWeight: '500',
      color: 'neutral.600',
      fontSize: 'sm',
    },
    gradientText: {
      bgGradient: 'linear(to-r, brand.500, purple.500)',
      bgClip: 'text',
    },
  },
  semanticTokens: {
    colors: {
      'bg-primary': { default: 'neutral.50', _dark: 'neutral.900' },
      'bg-secondary': { default: 'white', _dark: 'neutral.800' },
      'border-primary': { default: 'neutral.200', _dark: 'neutral.700' },
      'text-primary': { default: 'neutral.900', _dark: 'white' },
      'text-secondary': { default: 'neutral.600', _dark: 'neutral.300' },
    },
  },
});

export default theme;