import { DrawerNavigationProp, DrawerScreenProps } from '@react-navigation/drawer';
import { RouteProp } from '@react-navigation/native';

// ===== Param lists =====
export type RootDrawerParamList = {
  Inscription: undefined;
  Accueil: undefined;
  'Bien-être': undefined;
  'Moi & Mon Chien': undefined;
  Parcours: undefined;
  'Activités sensorielles': undefined;
  'Nutrition & Hydratation': undefined;
  'Vétérinaire & Prévention': undefined;
  Education: undefined;
  Interaction: undefined;
  'Cohabitation & Respect': undefined;
  'Aller plus loin': undefined;
  Monétisation: undefined;
  Communauté: undefined;
  Paramètres: undefined;
};

// Si tu as un stack interne pour Parcours
export type ParcoursStackParamList = {
  ParcoursHome: undefined;
  ParcoursDebutantList: undefined;
  ParcoursEquilibreList: undefined;
  ParcoursExpertList: undefined;
  StepDetail: { step: any; parcours: 'debutant' | 'equilibre' | 'expert' };
};

// ===== Helpers types (écran & nav) =====
export type DrawerProps<T extends keyof RootDrawerParamList> =
  DrawerScreenProps<RootDrawerParamList, T>;
export type DrawerNav = DrawerNavigationProp<RootDrawerParamList>;

export type RouteProps<
  TParamList,
  TRouteName extends keyof TParamList
> = RouteProp<TParamList, TRouteName>;

// ===== Déclaration globale pour React Navigation =====
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootDrawerParamList {}
  }
}
