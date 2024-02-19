import React, {useEffect, useState} from 'react';
import {
  Image,
  ImageProps,
  ImageSourcePropType,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import * as FileSystem from 'react-native-fs';
import {humanFileSize} from './utils';

console.log('DocumentDirectoryPath: ', FileSystem.DocumentDirectoryPath);
console.log('CachesDirectoryPath: ', FileSystem.CachesDirectoryPath);

type Props = ImageProps & {
  url?: string;
  stale?: number;
  cacheKey?: string;
  onCacheLoad?: () => void;
};

function ImageCache({url, cacheKey, stale, ...props}: Props) {
  const isCachedImage = !!url && !!cacheKey;
  const [source, setSource] = useState<ImageSourcePropType | undefined>(
    undefined,
  );

  useEffect(() => {
    if (!url) return;

    (async function () {
      const filePath = `${FileSystem.CachesDirectoryPath}/${cacheKey}.jpg`;

      const downloadFile = async () => {
        const downloadResult = await FileSystem.downloadFile({
          fromUrl: url,
          toFile: filePath,
        }).promise;
        console.log('FILE SAVED INTO FILESYTEM: ', filePath);
        console.log(`FILE SIZE: ${humanFileSize(downloadResult.bytesWritten)}`);
      };

      const readFile = async () => {
        try {
          let fileBase64 = await FileSystem.readFile(filePath, 'base64');
          const stat = await FileSystem.stat(filePath);
          const time = Date.now() - new Date(stat.ctime).getTime();
          if (stale && time > stale) {
            console.log('STALE IMAGE, DOWNLOADING AGAIN...');
            await FileSystem.unlink(filePath);
            await downloadFile();
            fileBase64 = await FileSystem.readFile(filePath, 'base64');
          }
          setSource({uri: `data:image/jpg;base64,${fileBase64}`});
        } catch (error) {
          throw error;
        }
      };

      readFile().catch(async error => {
        console.log(error.code);
        if (error.code === 'ENOENT') {
          try {
            await downloadFile();
            readFile();
          } catch (downloadError) {
            console.log('ERROR ON DOWNLOAD');
          }
        }
      });
    })();
  }, [cacheKey, stale, url]);

  return (
    <Image
      {...props}
      source={isCachedImage ? source : props.source ?? {uri: url}}
    />
  );
}

const IMAGE_JULIUS =
  'https://noticiasdatv.uol.com.br/media/uploads/everybody-hates-chris-julius-dia-dos-pais.jpg';

const LANDSCAPE_IMAGE =
  'https://upload.wikimedia.org/wikipedia/commons/3/3f/Fronalpstock_big.jpg';

export default function App() {
  return (
    <View style={styles.container}>
      <ImageCache
        url={IMAGE_JULIUS}
        style={styles.image}
        cacheKey="julius"
        // stale={5000}
      />
      <ScrollView>
        {Array.from({length: 10}).map((_, index) => (
          <ImageCache
            url={LANDSCAPE_IMAGE}
            style={styles.image}
            cacheKey={`landscape-${index}`}
            // stale={5000}
          />
        ))}
      </ScrollView>
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
