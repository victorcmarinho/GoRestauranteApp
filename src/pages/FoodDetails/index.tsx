import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useLayoutEffect,
} from 'react';
import { Image } from 'react-native';

import Icon from 'react-native-vector-icons/Feather';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import formatValue from '../../utils/formatValue';

import api from '../../services/api';

import {
  Container,
  Header,
  ScrollContainer,
  FoodsContainer,
  Food,
  FoodImageContainer,
  FoodContent,
  FoodTitle,
  FoodDescription,
  FoodPricing,
  AdditionalsContainer,
  Title,
  TotalContainer,
  AdittionalItem,
  AdittionalItemText,
  AdittionalQuantity,
  PriceButtonContainer,
  TotalPrice,
  QuantityContainer,
  FinishOrderButton,
  ButtonText,
  IconContainer,
} from './styles';

interface Params {
  id: number;
}

interface Extra {
  id: number;
  name: string;
  value: number;
  quantity: number;
}

interface Food {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  formattedPrice: string;
  extras: Extra[];
}

const FoodDetails: React.FC = () => {
  const [food, setFood] = useState({} as Food);
  const [extras, setExtras] = useState<Extra[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [foodQuantity, setFoodQuantity] = useState(1);

  const navigation = useNavigation();
  const route = useRoute();

  const routeParams = route.params as Params;

  useEffect(() => {
    async function loadFood(): Promise<void> {
      api.get<Food>(`foods/${routeParams.id}`).then(response => {
        const actualFood = response.data;
        setFood({
          ...actualFood,
          formattedPrice: formatValue(actualFood.price),
        });

        const addQuantityExtras = response.data.extras.map(extra => {
          return {
            ...extra,
            quantity: 0,
          };
        });

        setExtras(addQuantityExtras);
      });

      const response = await api.get(`favorites/${routeParams.id}`);

      setIsFavorite(!!response);
    }

    loadFood();
  }, [routeParams]);

  function handleIncrementExtra(id: number): void {
    const updatedQuantity = extras.map(extra => {
      if (extra.id === id) {
        return {
          ...extra,
          quantity: extra.quantity + 1,
        } as Extra;
      }
      return extra;
    });

    setExtras(updatedQuantity);
  }

  function handleDecrementExtra(id: number): void {
    const updatedQuantity = extras.map(extra => {
      if (extra.id === id && extra.quantity !== 0) {
        return { ...extra, quantity: extra.quantity - 1 } as Extra;
      }
      return extra;
    });

    setExtras(updatedQuantity);
  }

  function handleIncrementFood(): void {
    const newQuantity = foodQuantity + 1;
    setFoodQuantity(newQuantity);
  }

  function handleDecrementFood(): void {
    const newQuantity = foodQuantity - 1;
    if (newQuantity > 0) {
      setFoodQuantity(newQuantity);
    }
  }

  const toggleFavorite = useCallback(() => {
    const foodFavorite = food;
    delete foodFavorite.extras;

    if (isFavorite) {
      api.delete(`favorites/${food.id}`);
      setIsFavorite(false);
    } else {
      api.post(`favorites`, foodFavorite);
      setIsFavorite(true);
    }
  }, [isFavorite, food]);

  const cartTotal = useMemo(() => {
    const totalFood = food.price * foodQuantity;
    const totalOrder = extras.reduce((total, extra) => {
      const totalExtra = extra.quantity * extra.value;
      return total + totalExtra;
    }, totalFood);

    return formatValue(totalOrder);
  }, [extras, food, foodQuantity]);

  async function handleFinishOrder(): Promise<void> {
    await api.post('orders', {
      product_id: food.id,
      name: food.name,
      description: food.description,
      price: cartTotal,
      thumbnail_url: food.image_url,
      extras,
    });

    navigation.navigate('orders');
  }

  // Calculate the correct icon name
  const favoriteIconName = useMemo(
    () => (isFavorite ? 'favorite' : 'favorite-border'),
    [isFavorite],
  );

  useLayoutEffect(() => {
    // Add the favorite icon on the right of the header bar
    navigation.setOptions({
      headerRight: () => (
        <MaterialIcon
          name={favoriteIconName}
          size={24}
          color="#FFB84D"
          onPress={() => toggleFavorite()}
        />
      ),
    });
  }, [navigation, favoriteIconName, toggleFavorite]);

  return (
    <Container>
      <Header />

      <ScrollContainer>
        <FoodsContainer>
          <Food>
            <FoodImageContainer>
              <Image
                style={{ width: 327, height: 183 }}
                source={{
                  uri: food.image_url,
                }}
              />
            </FoodImageContainer>
            <FoodContent>
              <FoodTitle>{food.name}</FoodTitle>
              <FoodDescription>{food.description}</FoodDescription>
              <FoodPricing>{food.formattedPrice}</FoodPricing>
            </FoodContent>
          </Food>
        </FoodsContainer>
        <AdditionalsContainer>
          <Title>Adicionais</Title>
          {extras.map(extra => (
            <AdittionalItem key={extra.id}>
              <AdittionalItemText>{extra.name}</AdittionalItemText>
              <AdittionalQuantity>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="minus"
                  onPress={() => handleDecrementExtra(extra.id)}
                  testID={`decrement-extra-${extra.id}`}
                />
                <AdittionalItemText testID={`extra-quantity-${extra.id}`}>
                  {extra.quantity}
                </AdittionalItemText>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="plus"
                  onPress={() => handleIncrementExtra(extra.id)}
                  testID={`increment-extra-${extra.id}`}
                />
              </AdittionalQuantity>
            </AdittionalItem>
          ))}
        </AdditionalsContainer>
        <TotalContainer>
          <Title>Total do pedido</Title>
          <PriceButtonContainer>
            <TotalPrice testID="cart-total">{cartTotal}</TotalPrice>
            <QuantityContainer>
              <Icon
                size={15}
                color="#6C6C80"
                name="minus"
                onPress={handleDecrementFood}
                testID="decrement-food"
              />
              <AdittionalItemText testID="food-quantity">
                {foodQuantity}
              </AdittionalItemText>
              <Icon
                size={15}
                color="#6C6C80"
                name="plus"
                onPress={handleIncrementFood}
                testID="increment-food"
              />
            </QuantityContainer>
          </PriceButtonContainer>

          <FinishOrderButton onPress={() => handleFinishOrder()}>
            <ButtonText>Confirmar pedido</ButtonText>
            <IconContainer>
              <Icon name="check-square" size={24} color="#fff" />
            </IconContainer>
          </FinishOrderButton>
        </TotalContainer>
      </ScrollContainer>
    </Container>
  );
};

export default FoodDetails;
