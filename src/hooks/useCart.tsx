import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
   try {
      const stock = await api.get<Stock>(`/stock/${productId}`);

      const newCart = [...cart];
      const productOnCart = newCart.find(product => product.id === productId);

      const amountOnStock = stock.data.amount;
      const currentAmount = productOnCart ? productOnCart.amount : 0;
      const amount = currentAmount + 1;

      if(amount > amountOnStock) {
         toast.error('Quantidade solicitada fora de estoque');
         return
      }

      if(productOnCart) {
         productOnCart.amount = amount;
      } else {
         const product = await api.get<Product>(`/products/${productId}`);
         newCart.push({ ...product.data, amount: 1 });
      }

      setCart(newCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
   } catch {
      toast.error('Erro na adição do produto');
   }
  };

  const removeProduct = async (productId: number) => {
    try {
      const newCart = [...cart];

      const productIndex = newCart.findIndex(product => product.id === productId);
      if(productIndex >= 0) {
         newCart.splice(productIndex, 1);
         setCart(newCart)
         localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
      } else {
         throw new Error();   
      }
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId, 
    amount,
  }: UpdateProductAmount) => {
    try {
      if(amount <= 0) return
      
      const stock = await api.get<Stock>(`/stock/${productId}`);
      const amountOnStock = stock.data.amount;

      const newCart = [...cart];
      const productOnCart = newCart.find(product => product.id === productId);

      if(amountOnStock < amount) {
         toast.error('Quantidade solicitada fora de estoque');
         return
      }

      if(productOnCart){
         productOnCart.amount = amount;
         setCart(newCart);
         localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));

      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);
   console.log(localStorage.getItem('@RocketShoes:cart'))
  return context;
}
