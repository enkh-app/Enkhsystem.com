import { Redirect } from 'expo-router';
import { SeoHead } from '../components/seo-head';

export default function ExploreCompatibilityRoute() {
  return <><SeoHead title="ENKH Tools — AI ажлын хэрэгслүүд" description="ENKH-ийн бодитоор ажилладаг AI хэрэгслүүд." path="/tools" /><Redirect href="/tools" /></>;
}
