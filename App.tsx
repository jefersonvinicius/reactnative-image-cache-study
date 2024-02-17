import React, {useEffect, useState} from 'react';
import {
  Image,
  ImageProps,
  ImageSourcePropType,
  StyleSheet,
  View,
} from 'react-native';
import * as FileSystem from 'react-native-fs';

console.log('DocumentDirectoryPath: ', FileSystem.DocumentDirectoryPath);
console.log('CachesDirectoryPath: ', FileSystem.CachesDirectoryPath);

type Props = ImageProps & {
  url?: string;
  stale?: number;
  cacheKey?: string;
  onCacheLoad?: () => void;
};

function ImageCache({url, cacheKey, ...props}: Props) {
  const isCachedImage = !!url && !!cacheKey;
  console.log({isCachedImage});
  const [source, setSource] = useState<ImageSourcePropType>({uri: undefined});

  useEffect(() => {
    if (!url) return;

    (async function () {
      const filePath = `${FileSystem.CachesDirectoryPath}/${cacheKey}.jpg`;
      const readFile = async () => {
        try {
          const fileBase64 = await FileSystem.readFile(filePath, 'base64');
          const stat = await FileSystem.stat(filePath);
          const time = Date.now() - new Date(stat.ctime).getTime();
          setSource({uri: `data:image/jpg;base64,${fileBase64}`});
        } catch (error) {
          throw error;
        }
      };

      readFile().catch(async error => {
        console.log(error.code);
        if (error.code === 'ENOENT') {
          try {
            await FileSystem.downloadFile({
              fromUrl: url,
              toFile: filePath,
            }).promise;
            console.log('FILE SAVED INTO FILESYTEM: ', filePath);
            readFile();
          } catch (downloadError) {
            console.log('ERROR ON DOWNLOAD');
          }
        }
      });
    })();
  }, [cacheKey, url]);

  return (
    <Image
      {...props}
      source={isCachedImage ? source : props.source ?? {uri: url}}
    />
  );
}

const IMAGE_JULIUS =
  'https://noticiasdatv.uol.com.br/media/uploads/everybody-hates-chris-julius-dia-dos-pais.jpg';

export default function App() {
  return (
    <View style={styles.container}>
      <ImageCache
        url={IMAGE_JULIUS}
        style={styles.image}
        cacheKey="julius"
        stale={5000}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  image: {
    width: '100%',
    height: 300,
  },
});
