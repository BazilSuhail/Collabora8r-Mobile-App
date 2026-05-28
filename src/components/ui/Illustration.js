import { useState } from 'react';
import { View, useColorScheme } from 'react-native';
import { Image as ImageComp } from 'expo-image';
import { cn } from './cn';

// Bundled light/dark pairs from assets/illustrations (metro treats .svg as an asset).
const FILES = {
  auth: [require('../../../assets/illustrations/auth-light.svg'), require('../../../assets/illustrations/auth-dark.svg')],
  automation: [
    require('../../../assets/illustrations/automation-light.svg'),
    require('../../../assets/illustrations/automation-dark.svg'),
  ],
  empty: [require('../../../assets/illustrations/empty-light.svg'), require('../../../assets/illustrations/empty-dark.svg')],
  forms: [require('../../../assets/illustrations/forms-light.svg'), require('../../../assets/illustrations/forms-dark.svg')],
  integrations: [
    require('../../../assets/illustrations/integrations-light.svg'),
    require('../../../assets/illustrations/integrations-dark.svg'),
  ],
  security: [
    require('../../../assets/illustrations/security-light.svg'),
    require('../../../assets/illustrations/security-dark.svg'),
  ],
  settings: [
    require('../../../assets/illustrations/settings-light.svg'),
    require('../../../assets/illustrations/settings-dark.svg'),
  ],
  team: [require('../../../assets/illustrations/team-light.svg'), require('../../../assets/illustrations/team-dark.svg')],
  wiki: [require('../../../assets/illustrations/wiki-light.svg'), require('../../../assets/illustrations/wiki-dark.svg')],
};

// If a file is missing, the illustration hides itself instead of showing a broken image.
export default function Illustration({ name, alt = '', className, height = 160 }) {
  const scheme = useColorScheme();
  const [broken, setBroken] = useState(false);
  const pair = FILES[name];
  if (broken || !pair) return null;
  const source = scheme === 'dark' ? pair[1] : pair[0];
  return (
    <View
      className={cn('items-center w-full', className)}
      accessible={Boolean(alt)}
      accessibilityRole={alt ? 'image' : undefined}
      accessibilityLabel={alt || undefined}
      importantForAccessibility={alt ? 'yes' : 'no-hide-descendants'}
    >
      <ImageComp
        source={source}
        style={{ width: '100%', height }}
        contentFit="contain"
        onError={() => setBroken(true)}
      />
    </View>
  );
}
