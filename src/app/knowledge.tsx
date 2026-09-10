import { Redirect } from 'expo-router';
import { SeoHead } from '../components/seo-head';

export default function KnowledgeScreen() {
  return <><SeoHead title="ENKH Chat — Монгол AI туслах" description="ENKH AI-тай Монгол хэлээр үргэлжилсэн яриа хийнэ." path="/chat" /><Redirect href="/chat" /></>;
}
