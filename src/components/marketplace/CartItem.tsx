import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Plus, Minus } from 'lucide-react';
import { useState } from 'react';

interface CartItemProps {
    item: {
        product: {
            _id: string;
            name: string;
            images: string[];
            stock: number;
        };
        quantity: number;
        priceSnapshot: number;
    };
    onUpdateQuantity: (productId: string, quantity: number) => void;
    onRemove: (productId: string) => void;
}

const CartItem = ({ item, onUpdateQuantity, onRemove }: CartItemProps) => {
    const [quantity, setQuantity] = useState(item.quantity);
    const [isUpdating, setIsUpdating] = useState(false);

    const API_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
    const productImg = item.product.images[0];
    const imageUrl = productImg
        ? (productImg.startsWith('data:') || productImg.startsWith('http') ? productImg : `${API_URL}${productImg}`)
        : '/placeholder-product.svg';

    const handleQuantityChange = async (newQuantity: number) => {
        if (newQuantity < 1 || newQuantity > item.product.stock) return;

        setQuantity(newQuantity);
        setIsUpdating(true);
        try {
            await onUpdateQuantity(item.product._id, newQuantity);
        } finally {
            setIsUpdating(false);
        }
    };

    const totalPrice = item.priceSnapshot * quantity;

    return (
        <Card>
            <CardContent className="p-4">
                <div className="flex gap-4">
                    {/* Product Image */}
                    <div className="w-24 h-24 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden">
                        <img
                            src={imageUrl}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = '/placeholder-product.svg';
                            }}
                        />
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 flex flex-col justify-between">
                        <div>
                            <h3 className="font-semibold text-lg mb-1">{item.product.name}</h3>
                            <p className="text-sm text-gray-600">Price: Rs. {item.priceSnapshot.toFixed(2)}</p>
                            <p className="text-xs text-gray-500 mt-1">
                                {item.product.stock} available
                            </p>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-4 mt-2">
                            <div className="flex items-center gap-2">
                                <Button
                                    size="icon"
                                    variant="outline"
                                    className="h-8 w-8"
                                    onClick={() => handleQuantityChange(quantity - 1)}
                                    disabled={quantity <= 1 || isUpdating}
                                >
                                    <Minus className="h-4 w-4" />
                                </Button>
                                <Input
                                    type="number"
                                    value={quantity}
                                    onChange={(e) => {
                                        const val = parseInt(e.target.value);
                                        if (!isNaN(val)) handleQuantityChange(val);
                                    }}
                                    className="w-16 text-center"
                                    min={1}
                                    max={item.product.stock}
                                    disabled={isUpdating}
                                />
                                <Button
                                    size="icon"
                                    variant="outline"
                                    className="h-8 w-8"
                                    onClick={() => handleQuantityChange(quantity + 1)}
                                    disabled={quantity >= item.product.stock || isUpdating}
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>

                            <Button
                                size="icon"
                                variant="destructive"
                                className="h-8 w-8"
                                onClick={() => onRemove(item.product._id)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Total Price */}
                    <div className="flex flex-col items-end justify-between">
                        <p className="text-xl font-bold text-primary">
                            Rs. {totalPrice.toFixed(2)}
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default CartItem;
