// Henüz yapılmamış bir bölümün yer tutucusu: ne geleceğini ve hangi fazda geleceğini söyler.

import { Card } from '@/components/card';
import { Text } from '@/components/text';

export function ComingSoon({ title, body }: { title: string; body: string }) {
  return (
    <Card>
      <Text variant="footnote" tone="inkMuted">
        {title}
      </Text>
      <Text variant="bodyCompact">{body}</Text>
    </Card>
  );
}
